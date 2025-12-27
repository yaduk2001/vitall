

import re

import PyPDF2


def _clean_extracted_text(text: str) -> str:
    """
    Light cleanup to remove page headers/footers and duplicated junk.
    Keep this conservative so we don't delete real content.
    """
    # remove super common "Downloaded from ..." or "Page X" patterns
    text = re.sub(r"Downloaded from .*", "", text, flags=re.I)
    text = re.sub(r"\bPage\s*\d+\b", "", text, flags=re.I)
    # collapse 3+ newlines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_text_from_pdf(pdf_path: str) -> str:
    reader = PyPDF2.PdfReader(pdf_path)
    pages = []
    for page in reader.pages:
        page_text = page.extract_text() or ""
        pages.append(page_text)
    raw = "\n\n".join(pages)
    return _clean_extracted_text(raw)
