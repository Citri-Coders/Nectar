import { Card } from '../components/ui/Card';
import { ButtonLink } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Feedback';

export function NotFound() {
  return (
    <Card tone="elevated" padding="lg">
      <EmptyState
        icon="🧭"
        title="Ruta no encontrada"
        description="La página que buscas no existe o cambió de ubicación. Vuelve al inicio o explora los módulos de Néctar."
        action={
          <div className="row row-wrap gap-3">
            <ButtonLink to="/" variant="primary">
              Ir al inicio
            </ButtonLink>
            <ButtonLink to="/segmentacion" variant="outlined">
              Crear un plan
            </ButtonLink>
          </div>
        }
      />
    </Card>
  );
}
