import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronRight, Edit, FolderPlus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import FormTextarea from '../../components/forms/FormTextarea.jsx';
import { useAdminResource } from '../../hooks/useAdminResource.js';
import { useToast } from '../../hooks/useToast.js';
import { categories } from './adminMockData.js';
import { simulateAction } from './adminUtils.jsx';

const categorySchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  description: z.string().min(5, 'Descripcion requerida')
});

const Categorias = () => {
  const { data, setData, isLoading } = useAdminResource(() => categories, []);
  const [expanded, setExpanded] = useState(['cat-1']);
  const [editing, setEditing] = useState(null);
  const [subParent, setSubParent] = useState(null);
  const [deactivate, setDeactivate] = useState(null);
  const { showToast } = useToast();
  const form = useForm({ resolver: zodResolver(categorySchema), defaultValues: { name: '', description: '' } });

  const toggleExpanded = (id) => setExpanded((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const openCategory = (category = null) => {
    setEditing(category || { type: 'category' });
    form.reset({ name: category?.name || '', description: category?.description || '' });
  };

  const openSubcategory = (parent, subcategory = null) => {
    setSubParent(parent);
    setEditing(subcategory || { type: 'subcategory' });
    form.reset({ name: subcategory?.name || '', description: subcategory?.description || '' });
  };

  const save = async (values) => {
    await simulateAction();
    if (subParent) {
      setData((current) => current.map((category) => {
        if (category.id !== subParent.id) return category;
        if (editing?.id) {
          return { ...category, subcategories: category.subcategories.map((sub) => sub.id === editing.id ? { ...sub, ...values } : sub) };
        }
        return { ...category, subcategories: [...category.subcategories, { id: crypto.randomUUID(), ...values, active: true }] };
      }));
    } else if (editing?.id) {
      setData((current) => current.map((category) => category.id === editing.id ? { ...category, ...values } : category));
    } else {
      setData((current) => [{ id: crypto.randomUUID(), ...values, active: true, subcategories: [] }, ...current]);
    }
    setEditing(null);
    setSubParent(null);
    showToast({ type: 'success', title: 'Catalogo actualizado' });
  };

  const confirmDeactivate = async () => {
    await simulateAction();
    setData((current) => current.map((category) => {
      if (deactivate.parentId && category.id === deactivate.parentId) {
        return { ...category, subcategories: category.subcategories.map((sub) => sub.id === deactivate.id ? { ...sub, active: false } : sub) };
      }
      return category.id === deactivate.id ? { ...category, active: false } : category;
    }));
    showToast({ type: 'warning', title: 'Registro desactivado' });
    setDeactivate(null);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Categorias y subcategorias</h1>
          <p className="mt-1 text-sm text-neutral-500">Catalogo jerarquico para clasificacion de tickets.</p>
        </div>
        <Button onClick={() => openCategory()}><Plus className="h-4 w-4" />Nueva categoria</Button>
      </div>

      <div className="grid gap-3">
        {isLoading && Array.from({ length: 4 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-lg bg-neutral-100" />)}
        {(data || []).map((category) => (
          <Card key={category.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button className="flex items-center gap-2 text-left" onClick={() => toggleExpanded(category.id)} type="button">
                {expanded.includes(category.id) ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <div>
                  <h2 className="font-semibold text-neutral-900">{category.name} {!category.active && <Badge>Inactiva</Badge>}</h2>
                  <p className="text-sm text-neutral-500">{category.description}</p>
                </div>
              </button>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => openCategory(category)}><Edit className="h-4 w-4" />Editar</Button>
                <Button variant="ghost" onClick={() => openSubcategory(category)}><FolderPlus className="h-4 w-4" />Subcategoria</Button>
                <Button variant="ghost" onClick={() => setDeactivate(category)}>Desactivar</Button>
              </div>
            </div>
            {expanded.includes(category.id) && (
              <div className="mt-4 grid gap-2 border-l border-neutral-200 pl-4">
                {category.subcategories.map((sub) => (
                  <div key={sub.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-neutral-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{sub.name} {!sub.active && <Badge>Inactiva</Badge>}</p>
                      <p className="text-xs text-neutral-500">{sub.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => openSubcategory(category, sub)}>Editar</Button>
                      <Button variant="ghost" onClick={() => setDeactivate({ ...sub, parentId: category.id })}>Desactivar</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal isOpen={Boolean(editing)} title={subParent ? 'Subcategoria' : 'Categoria'} onClose={() => { setEditing(null); setSubParent(null); }}>
        <form className="grid gap-4" onSubmit={form.handleSubmit(save)}>
          <FormInput register={form.register} name="name" label="Nombre" error={form.formState.errors.name} />
          <FormTextarea register={form.register} name="description" label="Descripcion" error={form.formState.errors.description} />
          <Button type="submit" isLoading={form.formState.isSubmitting}>Guardar</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deactivate)}
        title="Desactivar registro"
        message={`Confirma que deseas desactivar ${deactivate?.name}.`}
        onCancel={() => setDeactivate(null)}
        onConfirm={confirmDeactivate}
      />
    </div>
  );
};

export default Categorias;
