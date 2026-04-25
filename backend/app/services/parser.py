from io import BytesIO

import docx
import fitz
import pdfplumber


class ParserError(Exception):
    pass


def parse_pdf(content: bytes) -> str:
    if not content:
        raise ParserError('Uploaded PDF is empty.')

    text_blocks: list[str] = []
    try:
        with pdfplumber.open(BytesIO(content)) as pdf:
            for page in pdf.pages:
                text_blocks.append(page.extract_text() or '')
    except Exception:
        text_blocks = []

    extracted = '\n'.join(text_blocks).strip()
    if extracted:
        return extracted

    try:
        text_blocks = []
        doc = fitz.open(stream=content, filetype='pdf')
        for page in doc:
            text_blocks.append(page.get_text('text'))
        extracted = '\n'.join(text_blocks).strip()
    except Exception as exc:
        raise ParserError('Could not read PDF. Please upload a text-based PDF.') from exc

    if not extracted:
        raise ParserError('No readable text found in PDF.')
    return extracted


def parse_docx(content: bytes) -> str:
    if not content:
        raise ParserError('Uploaded DOCX is empty.')

    try:
        file = BytesIO(content)
        document = docx.Document(file)
        extracted = '\n'.join([p.text for p in document.paragraphs if p.text.strip()]).strip()
    except Exception as exc:
        raise ParserError('Could not parse DOCX file.') from exc

    if not extracted:
        raise ParserError('No readable text found in DOCX.')
    return extracted
