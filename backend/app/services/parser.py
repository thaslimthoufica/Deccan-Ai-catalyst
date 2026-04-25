from io import BytesIO

import docx
import fitz
import pdfplumber


def parse_pdf(content: bytes) -> str:
    text_blocks: list[str] = []
    with pdfplumber.open(BytesIO(content)) as pdf:
        for page in pdf.pages:
            text_blocks.append(page.extract_text() or '')
    if any(block.strip() for block in text_blocks):
        return '\n'.join(text_blocks)

    text_blocks = []
    doc = fitz.open(stream=content, filetype='pdf')
    for page in doc:
        text_blocks.append(page.get_text('text'))
    return '\n'.join(text_blocks)


def parse_docx(content: bytes) -> str:
    file = BytesIO(content)
    document = docx.Document(file)
    return '\n'.join([p.text for p in document.paragraphs if p.text.strip()])
