import { useRef, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';

const SignaturePad = ({ onSave, signature }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Configurar el canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Estilo del trazo
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Cargar firma existente si hay
    if (signature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setIsEmpty(false);
      };
      img.src = signature;
    }
  }, [signature]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    // Soportar tanto mouse como touch
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    e.preventDefault(); // Prevenir scroll en touch devices

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    if (onSave) {
      onSave(null);
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/png');
    if (onSave) {
      onSave(dataURL);
    }
  };

  return (
    <div className="signature-pad-container">
      <canvas
        ref={canvasRef}
        className="border border-dark rounded"
        style={{
          width: '100%',
          height: '200px',
          touchAction: 'none',
          cursor: 'crosshair',
          backgroundColor: '#fff'
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="mt-2 d-flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={clearSignature}
          disabled={isEmpty}
        >
          Limpiar Firma
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={saveSignature}
          disabled={isEmpty}
        >
          Guardar Firma
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
