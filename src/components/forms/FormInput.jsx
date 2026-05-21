import Input from '../common/Input.jsx';

const FormInput = ({ register, name, label, error, ...props }) => (
  <Input label={label} error={error?.message} {...register(name)} {...props} />
);

export default FormInput;
