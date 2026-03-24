package services

import (
	"bytes"
	"fmt"
	"html"
	"html/template"
	"log"
	"path/filepath"
	"sync"
	"time"

	"github.com/thanunbenz/su-booking-room/internal/config"
	"gopkg.in/gomail.v2"
)

// EmailJob - Job structure สำหรับการส่งอีเมล
type EmailJob struct {
	To          string
	Subject     string
	TemplateName string
	Data        map[string]interface{}
	RetryCount  int
}

// EmailService - Service สำหรับจัดการการส่งอีเมล
type EmailService struct {
	config     *config.SMTPConfig
	dialer     *gomail.Dialer
	queue      chan *EmailJob
	wg         sync.WaitGroup
	stopChan   chan struct{}
	templates  *template.Template
}

// NewEmailService - สร้าง EmailService instance
func NewEmailService(cfg *config.SMTPConfig) *EmailService {
	if !cfg.Enabled {
		log.Println("📧 Email service is disabled")
		return &EmailService{
			config:   cfg,
			queue:    make(chan *EmailJob, 1), // Minimal queue
			stopChan: make(chan struct{}),
		}
	}

	// สร้าง SMTP dialer
	dialer := gomail.NewDialer(cfg.Host, cfg.Port, cfg.Username, cfg.Password)

	// Load email templates
	templates, err := loadEmailTemplates()
	if err != nil {
		log.Printf("⚠️  WARNING: Failed to load email templates: %v\n", err)
		log.Println("📧 Email service will continue without templates")
	}

	service := &EmailService{
		config:    cfg,
		dialer:    dialer,
		queue:     make(chan *EmailJob, cfg.QueueSize),
		stopChan:  make(chan struct{}),
		templates: templates,
	}

	log.Printf("✅ Email service initialized with %d workers\n", cfg.WorkerCount)
	return service
}

// Start - เริ่ม email workers
func (s *EmailService) Start() {
	if !s.config.Enabled {
		log.Println("📧 Email service is disabled, workers not started")
		return
	}

	for i := 1; i <= s.config.WorkerCount; i++ {
		s.wg.Add(1)
		go s.worker(i)
	}

	log.Printf("🚀 Started %d email workers\n", s.config.WorkerCount)
}

// Stop - หยุด email workers
func (s *EmailService) Stop() {
	if !s.config.Enabled {
		return
	}

	log.Println("🛑 Stopping email service...")
	close(s.stopChan)
	s.wg.Wait()
	close(s.queue)
	log.Println("✅ Email service stopped")
}

// SendEmail - เพิ่ม email job เข้า queue
func (s *EmailService) SendEmail(job *EmailJob) error {
	if !s.config.Enabled {
		log.Printf("📧 Email service disabled, skipping email to: %s\n", job.To)
		return nil
	}

	// Validate email job
	if job.To == "" {
		return fmt.Errorf("recipient email is required")
	}
	if job.Subject == "" {
		return fmt.Errorf("email subject is required")
	}

	select {
	case s.queue <- job:
		log.Printf("📨 Email job queued: %s -> %s\n", job.Subject, job.To)
		return nil
	case <-time.After(5 * time.Second):
		return fmt.Errorf("email queue is full, timeout after 5s")
	}
}

// worker - ประมวลผล email jobs
func (s *EmailService) worker(id int) {
	defer s.wg.Done()

	log.Printf("👷 Email worker #%d started\n", id)

	for {
		select {
		case job, ok := <-s.queue:
			if !ok {
				log.Printf("👷 Email worker #%d stopped (queue closed)\n", id)
				return
			}
			s.processJob(id, job)

		case <-s.stopChan:
			log.Printf("👷 Email worker #%d stopped (shutdown signal)\n", id)
			return
		}
	}
}

// processJob - ประมวลผล email job พร้อม retry mechanism
func (s *EmailService) processJob(workerID int, job *EmailJob) {
	for attempt := 1; attempt <= s.config.RetryCount; attempt++ {
		err := s.sendEmailWithSMTP(job)
		if err == nil {
			log.Printf("✅ Worker #%d: Email sent successfully to %s (attempt %d)\n",
				workerID, job.To, attempt)
			return
		}

		log.Printf("❌ Worker #%d: Failed to send email to %s (attempt %d/%d): %v\n",
			workerID, job.To, attempt, s.config.RetryCount, err)

		// Retry with delay (except last attempt)
		if attempt < s.config.RetryCount {
			time.Sleep(s.config.RetryDelay)
		}
	}

	log.Printf("🚨 Worker #%d: Email to %s FAILED after %d attempts\n",
		workerID, job.To, s.config.RetryCount)
}

// sendEmailWithSMTP - ส่งอีเมลผ่าน SMTP
func (s *EmailService) sendEmailWithSMTP(job *EmailJob) error {
	// Render HTML body
	htmlBody, err := s.renderTemplate(job.TemplateName, job.Data)
	if err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	// สร้าง message
	m := gomail.NewMessage()
	m.SetHeader("From", s.config.From)
	m.SetHeader("To", job.To)
	m.SetHeader("Subject", job.Subject)
	m.SetBody("text/html", htmlBody)

	// ส่งผ่าน SMTP
	if err := s.dialer.DialAndSend(m); err != nil {
		return fmt.Errorf("SMTP send failed: %w", err)
	}

	return nil
}

// renderTemplate - แปลง template เป็น HTML
func (s *EmailService) renderTemplate(templateName string, data map[string]interface{}) (string, error) {
	if s.templates == nil {
		return s.renderFallbackTemplate(templateName, data), nil
	}

	var buf bytes.Buffer
	log.Printf("🔍 Rendering template: %s\n", templateName)
	if err := s.templates.ExecuteTemplate(&buf, templateName, data); err != nil {
		log.Printf("⚠️  Template rendering failed for %s: %v\n", templateName, err)
		log.Printf("⚠️  Using fallback template\n")
		return s.renderFallbackTemplate(templateName, data), nil
	}

	log.Printf("✅ Template %s rendered successfully\n", templateName)
	return buf.String(), nil
}

// renderFallbackTemplate - สร้าง HTML อย่างง่ายถ้า template ไม่มี
func (s *EmailService) renderFallbackTemplate(templateName string, data map[string]interface{}) string {
	// Use "body" instead of "html" to avoid shadowing the html package import,
	// which is needed for html.EscapeString to prevent XSS.
	body := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SU Booking Room</h1>
        </div>
        <div class="content">
`
	// Add dynamic content with HTML escaping to prevent XSS
	if msg, ok := data["Message"].(string); ok {
		body += fmt.Sprintf("<p>%s</p>", html.EscapeString(msg))
	}
	if details, ok := data["Details"].(string); ok {
		body += fmt.Sprintf("<div style='background: white; padding: 15px; border-left: 4px solid #4F46E5;'>%s</div>", html.EscapeString(details))
	}

	body += `
        </div>
        <div class="footer">
            <p>Silpakorn University - Computer Science Department</p>
            <p>This is an automated message, please do not reply.</p>
        </div>
    </div>
</body>
</html>
`
	return body
}

// loadEmailTemplates - โหลด email templates ทั้งหมด
func loadEmailTemplates() (*template.Template, error) {
	// กำหนด path ของ templates directory
	templatesDir := filepath.Join("internal", "templates", "email")
	pattern := filepath.Join(templatesDir, "*.html")

	// โหลดทุก template ในครั้งเดียว
	tmpl, err := template.ParseGlob(pattern)
	if err != nil {
		log.Printf("⚠️  Could not load templates: %v\n", err)
		return template.New(""), nil
	}

	log.Printf("✅ Loaded email templates: %v\n", tmpl.DefinedTemplates())
	return tmpl, nil
}

// GetQueueStatus - ดูสถานะ queue (สำหรับ monitoring)
func (s *EmailService) GetQueueStatus() map[string]interface{} {
	return map[string]interface{}{
		"queue_size":    len(s.queue),
		"queue_capacity": s.config.QueueSize,
		"workers":       s.config.WorkerCount,
		"enabled":       s.config.Enabled,
	}
}
