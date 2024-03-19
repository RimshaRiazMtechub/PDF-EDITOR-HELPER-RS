
import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import html2canvas from 'html2canvas';
import { PDFDocument, rgb } from 'pdf-lib';
import { Col, Row } from 'reactstrap';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const PdfEditor = () => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [textItems, setTextItems] = useState([]);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [canvasWidth, setCanvasWidth] = useState(800);
  const canvasRef = useRef();

  useEffect(() => {
    const updateCanvasWidth = () => {
      const pdfPage = document.querySelector('.react-pdf__Page__canvas');
      if (pdfPage) {
        const { width } = pdfPage.getBoundingClientRect();
        setCanvasWidth(width);
      }
    };
    window.addEventListener('resize', updateCanvasWidth);
    updateCanvasWidth();
    return () => window.removeEventListener('resize', updateCanvasWidth);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleTextPlacement = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTextItems([...textItems, { x, y, page: pageNumber ,text:"TEXT"}]);
    setClickPosition({ x, y });
  };
// correct ..but not showing text placed 
  // const handleDownloadPDF = async () => {
  //   try {
  //     // Capture the canvas as an image
  //     const canvas = canvasRef.current;
  //     const canvasImage = canvas.toDataURL('image/png'); // Capture as PNG
  
  //     // Load the PDF
  //     const pdfBytes = await fetch("http://localhost:3002/uploads/Multipages.pdf").then((res) => res.arrayBuffer());
  //     const pdfDoc = await PDFDocument.load(pdfBytes);
  
  //     // Embed the canvas image onto each page of the PDF
  //     const pngImage = await pdfDoc.embedPng(canvasImage);
  //     const pages = pdfDoc.getPages();
  //     for (let i = 0; i < pages.length; i++) {
  //       const page = pages[i];
  //       const { width, height } = page.getSize();
  //       const scaleFactor = width / canvas.width;
  //       page.drawImage(pngImage, {
  //         x: 0,
  //         y: 0,
  //         width: canvas.width,
  //         height: canvas.height,
  //         scale: scaleFactor,
  //       });
  // page.drawText("ITEM", {
  //   x: 36.3499755859375 , // Adjust position according to scale factor
  //   y: (height - 28), // Adjust position according to scale factor and flip y-coordinate
  //   size: 12,
  //   color: rgb(0, 0, 0),
  // });
  //     }
  
  //     // Save the modified PDF
  //     const modifiedPdfBytes = await pdfDoc.save();
  
  //     // Create a blob from PDF data
  //     const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
  
  //     // Create a temporary URL for the blob
  //     const url = URL.createObjectURL(blob);
  
  //     // Create a temporary link element to trigger the download
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = "modified_pdf_with_text.pdf";
  //     document.body.appendChild(a);
  //     a.click();
  
  //     // Clean up
  //     URL.revokeObjectURL(url);
  //     document.body.removeChild(a);
  //   } catch (error) {
  //     console.error("Error generating PDF:", error);
  //   }
  // };
  const handleDownloadPDF = async () => {
    try {
      // Load the PDF
      const pdfBytes = await fetch("http://localhost:3002/uploads/Multipages.pdf").then((res) => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
  
      // Loop through text items
      for (const textItem of textItems) {
        const page = pages[textItem.page - 1]; // Pages are zero-indexed
  
        // Get the size of the page
        const { width, height } = page.getSize();
  
        // Calculate the ratio between canvas width and PDF page width
        const ratio = canvasWidth / width;
  
        // Adjust text position based on the ratio
        const x = textItem.x / ratio;
        const y = height - textItem.y / ratio;
  
        // Draw the text on the page
        page.drawText(textItem.text, {
          x,
          y,
          size: 12,
          color: rgb(0, 0, 0),
        });
      }
  
      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();
  
      // Create a blob from PDF data
      const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
  
      // Create a temporary URL for the blob
      const url = URL.createObjectURL(blob);
  
      // Create a temporary link element to trigger the download
      const a = document.createElement("a");
      a.href = url;
      a.download = "modified_pdf_with_text.pdf";
      document.body.appendChild(a);
      a.click();
  
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };
  return (
    <>
      <Row>
        <Col xs={2}></Col>
        <Col xs={8}>
          <div style={{ position: 'relative' }}>
            <canvas
              ref={canvasRef}
              onClick={handleTextPlacement}
              style={{ border: '1px solid black', width: canvasWidth, height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
            />
            <Document
              file="http://localhost:3002/uploads/Multipages.pdf"
              onLoadSuccess={onDocumentLoadSuccess}
              style={{ display: 'none' }} // Hide the PDF page element
            >
              <Page
                renderAnnotationLayer={false}
                renderTextLayer={false}
                pageNumber={pageNumber}
                width={canvasWidth}
              />
            </Document>

            <div>
              {textItems.map((item, index) => (
                <div key={index} style={{ position: 'absolute', top: item.y, left: item.x, zIndex: 2 }}>
                  {item.text} placed on page {item.page}
                </div>
              ))}
            </div>

          </div>
          <div>
            <div>
              Clicked at: ({clickPosition.x}, {clickPosition.y})
            </div>
            <button disabled={pageNumber <= 1} onClick={() => setPageNumber(pageNumber - 1)}>Previous</button>
            <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(pageNumber + 1)}>Next</button>
          </div>
          <button onClick={handleDownloadPDF}>Download PDF</button>
        </Col>
        <Col xs={2}></Col>
      </Row>
    </>
  );
};

export default PdfEditor;
