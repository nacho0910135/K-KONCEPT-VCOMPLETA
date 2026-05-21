import Button from './Button.jsx';
import Modal from './Modal.jsx';

const ConfirmDialog = ({ isOpen, title = 'Confirmar accion', message, onCancel, onConfirm, isLoading }) => (
  <Modal
    isOpen={isOpen}
    title={title}
    onClose={onCancel}
    footer={
      <>
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button variant="danger" isLoading={isLoading} onClick={onConfirm}>Confirmar</Button>
      </>
    }
  >
    <p className="text-sm leading-6 text-neutral-600">{message}</p>
  </Modal>
);

export default ConfirmDialog;
