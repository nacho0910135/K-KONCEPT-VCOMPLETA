import Card from '../../components/common/Card.jsx';

const PlaceholderPage = ({ title, description = 'Modulo listo para conectar con el servicio correspondiente.' }) => (
  <div className="grid gap-6">
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
    </div>
    <Card className="p-6">
      <p className="text-sm leading-6 text-neutral-600">
        Esta pantalla queda preparada dentro del layout, rutas protegidas y capa de servicios para implementar el flujo funcional del modulo.
      </p>
    </Card>
  </div>
);

export default PlaceholderPage;
