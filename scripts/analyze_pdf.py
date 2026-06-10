import pdfplumber

pdf_path = r"C:\Users\Comunicaciones\Desktop\Moza\Proyecto Extreme V6.9\Reporte de Inventario-20260610-103507.pdf"

try:
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            print(f"--- Page {i+1} ---")
            print(page.extract_text())
            print("\n")
except Exception as e:
    print(f"Error: {e}")
