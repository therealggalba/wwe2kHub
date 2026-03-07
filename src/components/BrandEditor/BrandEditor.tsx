import React, { useState, useEffect } from 'react';
import { db } from '../../db/db';
import type { Brand } from '../../models/types';
import styles from './BrandEditor.module.scss';

const BrandEditor: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Brand | null>(null);

  useEffect(() => {
    const loadBrands = async () => {
      const allBrands = await db.brands.toArray();
      setBrands(allBrands.sort((a, b) => a.priority - b.priority));
    };
    loadBrands();
  }, []);

  const handleEdit = (brand: Brand) => {
    setEditingId(brand.id!);
    setEditForm({ ...brand });
  };

  const handleSave = async () => {
    if (!editForm || editingId === null) return;
    
    try {
      await db.brands.update(editingId, editForm);
      setBrands(prev => prev.map(b => b.id === editingId ? editForm : b).sort((a, b) => a.priority - b.priority));
      setEditingId(null);
      setEditForm(null);
      alert('Marca actualizada con éxito');
    } catch (error) {
      console.error('Failed to update brand:', error);
      alert('Error al actualizar la marca');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const fixPath = (path: string | undefined): string => {
    if (!path) return '';
    if (path.startsWith('data:image')) return path;
    if (path.startsWith('./')) return path.replace('./', '/');
    return path;
  };

  return (
    <div className={styles.editorContainer}>
      <h3 className={styles.title}>Configuración de Marcas</h3>
      <div className={styles.brandList}>
        {brands.map(brand => (
          <div key={brand.id} className={styles.brandCard}>
            {editingId === brand.id ? (
              <div className={styles.editForm}>
                <div className={styles.field}>
                  <label>Nombre:</label>
                  <input 
                    type="text" 
                    value={editForm?.name || ''} 
                    onChange={e => setEditForm(prev => prev ? { ...prev, name: e.target.value } : null)} 
                  />
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label>Color Primario:</label>
                    <input 
                      type="color" 
                      value={editForm?.primaryColor || '#000000'} 
                      onChange={e => setEditForm(prev => prev ? { ...prev, primaryColor: e.target.value } : null)} 
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Color Secundario:</label>
                    <input 
                      type="color" 
                      value={editForm?.secondaryColor || '#000000'} 
                      onChange={e => setEditForm(prev => prev ? { ...prev, secondaryColor: e.target.value } : null)} 
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label>Ruta del Logo:</label>
                  <input 
                    type="text" 
                    value={editForm?.logo || ''} 
                    onChange={e => setEditForm(prev => prev ? { ...prev, logo: e.target.value } : null)} 
                  />
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label>Prioridad (Orden):</label>
                    <input 
                      type="number" 
                      value={editForm?.priority || 0} 
                      onChange={e => setEditForm(prev => prev ? { ...prev, priority: parseInt(e.target.value) } : null)} 
                    />
                  </div>
                  <div className={styles.fieldCheck}>
                    <label>
                      <input 
                        type="checkbox" 
                        checked={editForm?.isMajorBrand || false} 
                        onChange={e => setEditForm(prev => prev ? { ...prev, isMajorBrand: e.target.checked } : null)} 
                      />
                      Marca Principal (Show semanal importante)
                    </label>
                  </div>
                </div>
                <div className={styles.actions}>
                  <button onClick={handleSave} className={styles.saveBtn}>Guardar</button>
                  <button onClick={handleCancel} className={styles.cancelBtn}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div className={styles.displayCard}>
                <div className={styles.brandInfo}>
                  {brand.logo && <img src={fixPath(brand.logo)} alt={brand.name} className={styles.logoPreview} />}
                  <div className={styles.details}>
                    <span className={styles.brandName}>{brand.name}</span>
                    <div className={styles.colors}>
                        <div className={styles.colorDot} style={{ backgroundColor: brand.primaryColor }} title="Color Primario" />
                        <div className={styles.colorDot} style={{ backgroundColor: brand.secondaryColor }} title="Color Secundario" />
                    </div>
                  </div>
                </div>
                <button onClick={() => handleEdit(brand)} className={styles.editBtn}>Editar ✏️</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandEditor;
