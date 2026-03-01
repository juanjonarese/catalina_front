import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Container, Card, Button, Spinner } from "react-bootstrap";

const RespuestaPagoScreen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState("loading"); // loading, success, pending, failure

  useEffect(() => {
    const status = searchParams.get("status");

    // Determinar el estado según los parámetros
    if (status === "approved") {
      setEstado("success");
    } else if (status === "pending" || status === "in_process") {
      setEstado("pending");
    } else {
      setEstado("failure");
    }
  }, [searchParams]);

  const handleVolverInicio = () => {
    navigate("/");
  };

  const renderContent = () => {
    switch (estado) {
      case "loading":
        return (
          <Card className="text-center p-5 shadow">
            <Card.Body>
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h3>Procesando pago...</h3>
              <p className="text-muted">Por favor espera un momento.</p>
            </Card.Body>
          </Card>
        );

      case "success":
        return (
          <Card className="text-center p-5 shadow border-success">
            <Card.Body>
              <div className="mb-4">
                <i
                  className="bi bi-check-circle-fill text-success"
                  style={{ fontSize: "5rem" }}
                ></i>
              </div>
              <h2 className="text-success mb-3">¡Pago Exitoso!</h2>
              <p className="lead mb-4">
                Tu pago ha sido procesado correctamente.
              </p>
              <div className="alert alert-success">
                <strong>¡Reserva Confirmada!</strong>
                <p className="mb-0 mt-2">
                  Tu reserva ha sido creada automáticamente. Recibirás un email
                  con el código de confirmación y los detalles de tu reserva.
                </p>
              </div>
              <div className="d-flex gap-2 justify-content-center mt-4">
                <Button variant="primary" onClick={handleVolverInicio} size="lg">
                  Volver al Inicio
                </Button>
              </div>
              <p className="text-muted mt-4 small">
                <strong>ID de Pago:</strong> {searchParams.get("payment_id")}
              </p>
            </Card.Body>
          </Card>
        );

      case "pending":
        return (
          <Card className="text-center p-5 shadow border-warning">
            <Card.Body>
              <div className="mb-4">
                <i
                  className="bi bi-clock-fill text-warning"
                  style={{ fontSize: "5rem" }}
                ></i>
              </div>
              <h2 className="text-warning mb-3">Pago Pendiente</h2>
              <p className="lead mb-4">
                Tu pago está siendo procesado.
              </p>
              <div className="alert alert-warning">
                <strong>Estamos procesando tu pago</strong>
                <p className="mb-0 mt-2">
                  Esto puede tardar unos minutos. Una vez confirmado, recibirás
                  un email con los detalles de tu reserva.
                </p>
              </div>
              <div className="d-flex gap-2 justify-content-center mt-4">
                <Button variant="primary" onClick={handleVolverInicio} size="lg">
                  Volver al Inicio
                </Button>
              </div>
              <p className="text-muted mt-4 small">
                <strong>ID de Pago:</strong> {searchParams.get("payment_id")}
              </p>
            </Card.Body>
          </Card>
        );

      case "failure":
        return (
          <Card className="text-center p-5 shadow border-danger">
            <Card.Body>
              <div className="mb-4">
                <i
                  className="bi bi-x-circle-fill text-danger"
                  style={{ fontSize: "5rem" }}
                ></i>
              </div>
              <h2 className="text-danger mb-3">Pago Rechazado</h2>
              <p className="lead mb-4">
                No se pudo procesar tu pago.
              </p>
              <div className="alert alert-danger">
                <strong>¿Qué puedes hacer?</strong>
                <ul className="text-start mt-2 mb-0">
                  <li>Verifica los datos de tu tarjeta</li>
                  <li>Intenta con otro método de pago</li>
                  <li>Contacta a tu banco si el problema persiste</li>
                </ul>
              </div>
              <div className="d-flex gap-2 justify-content-center mt-4">
                <Button variant="primary" onClick={handleVolverInicio} size="lg">
                  Intentar Nuevamente
                </Button>
              </div>
            </Card.Body>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Container className="py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">{renderContent()}</div>
      </div>
    </Container>
  );
};

export default RespuestaPagoScreen;
