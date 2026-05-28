import logging
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

logger = logging.getLogger(__name__)

class PDFGenerationError(Exception):
    """Raised when PDF generation fails."""
    pass

TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"

class PDFService:
    def __init__(self, template_dir: Path = TEMPLATE_DIR) -> None:
        self.template_dir = template_dir
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=True
        )

    def render_resume_to_html(self, resume_data: dict) -> str:
        """Renders the resume HTML using Jinja2."""
        try:
            template = self.jinja_env.get_template("resume.html")
            return template.render(**resume_data)
        except Exception as exc:
            logger.exception("Failed to render resume HTML template.")
            raise PDFGenerationError(f"Template rendering failed: {str(exc)}") from exc

    def generate_pdf_from_html(self, html_content: str) -> bytes:
        """Compiles HTML string into PDF bytes using WeasyPrint."""
        try:
            # Import weasyprint inside the method to allow starting the app
            # even if GTK+ dependencies are missing at load time.
            import weasyprint
            
            pdf_bytes = weasyprint.HTML(string=html_content).write_pdf()
            if not pdf_bytes:
                raise PDFGenerationError("WeasyPrint returned empty PDF bytes.")
            return pdf_bytes
        except ImportError as exc:
            logger.exception("WeasyPrint could not be imported. Check GTK+ setup.")
            raise PDFGenerationError(
                "PDF engine not initialized. Please ensure WeasyPrint and GTK+ libraries are properly installed on the system."
            ) from exc
        except Exception as exc:
            logger.exception("WeasyPrint PDF compiling failed.")
            raise PDFGenerationError(f"PDF compilation failed: {str(exc)}") from exc

pdf_service = PDFService()
