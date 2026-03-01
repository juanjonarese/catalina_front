import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import SignaturePad from './SignaturePad';
import Swal from 'sweetalert2';

const FormularioRegistroPasajero = ({ onSubmit, pasajeroData = null }) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: pasajeroData || {
      nombre: '',
      dni: '',
      edad: '',
      nacionalidad: '',
      telefono: '',
      checkin: '',
      checkout: '',
      habitacion: ''
    }
  });

  const [firma, setFirma] = useState(pasajeroData?.firma || null);

  const onSubmitForm = (data) => {
    const datosCompletos = {
      ...data,
      firma
    };

    onSubmit(datosCompletos);
    reset();
    setFirma(null);
  };

  const handleFirmaGuardada = (firmaData) => {
    setFirma(firmaData);
    if (firmaData) {
      Swal.fire({
        icon: 'success',
        title: 'Firma guardada',
        text: 'Su firma ha sido guardada correctamente',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title className="text-center mb-4 fs-3">
          Formulario de Registro de Pasajero
        </Card.Title>

        <Form onSubmit={handleSubmit(onSubmitForm)}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Nombre y Apellido *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingrese nombre completo"
                  {...register('nombre', {
                    required: 'El nombre es requerido',
                    minLength: {
                      value: 3,
                      message: 'El nombre debe tener al menos 3 caracteres'
                    }
                  })}
                  isInvalid={!!errors.nombre}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.nombre?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>DNI *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingrese DNI"
                  {...register('dni', {
                    required: 'El DNI es requerido',
                    pattern: {
                      value: /^[0-9]+$/,
                      message: 'El DNI debe contener solo números'
                    }
                  })}
                  isInvalid={!!errors.dni}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.dni?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Edad *</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Edad"
                  {...register('edad', {
                    required: 'La edad es requerida',
                    min: {
                      value: 1,
                      message: 'La edad debe ser mayor a 0'
                    },
                    max: {
                      value: 120,
                      message: 'Ingrese una edad válida'
                    }
                  })}
                  isInvalid={!!errors.edad}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.edad?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>Nacionalidad *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ingrese nacionalidad"
                  {...register('nacionalidad', {
                    required: 'La nacionalidad es requerida',
                    minLength: {
                      value: 3,
                      message: 'Ingrese una nacionalidad válida'
                    }
                  })}
                  isInvalid={!!errors.nacionalidad}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.nacionalidad?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>Teléfono *</Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="Ingrese teléfono"
                  {...register('telefono', {
                    required: 'El teléfono es requerido',
                    pattern: {
                      value: /^[0-9+\-\s()]+$/,
                      message: 'Ingrese un teléfono válido'
                    }
                  })}
                  isInvalid={!!errors.telefono}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.telefono?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Check-in *</Form.Label>
                <Form.Control
                  type="date"
                  {...register('checkin', {
                    required: 'La fecha de check-in es requerida'
                  })}
                  isInvalid={!!errors.checkin}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.checkin?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>Check-out *</Form.Label>
                <Form.Control
                  type="date"
                  {...register('checkout', {
                    required: 'La fecha de check-out es requerida'
                  })}
                  isInvalid={!!errors.checkout}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.checkout?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>Habitación *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nro. de habitación"
                  {...register('habitacion', {
                    required: 'El número de habitación es requerido'
                  })}
                  isInvalid={!!errors.habitacion}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.habitacion?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col>
              <Form.Group>
                <Form.Label>Firma Digital (opcional)</Form.Label>
                <p className="text-muted small mb-2">
                  Puede firmar en el recuadro utilizando su dedo o lápiz digital
                </p>
                <SignaturePad
                  onSave={handleFirmaGuardada}
                  signature={firma}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="text-center">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="px-5"
            >
              Registrar Pasajero
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default FormularioRegistroPasajero;
