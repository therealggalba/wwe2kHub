import React from 'react';
import { db } from '../../db/db';
import styles from './DatabaseTools.module.scss';

const DatabaseTools: React.FC = () => {
  const handleExport = async () => {
    try {
      const wrestlers = await db.wrestlers.toArray();
      const championships = await db.championships.toArray();
      
      const exportData = {
        version: 1,
        timestamp: new Date().toISOString(),
        wrestlers: wrestlers.map(w => ({
          name: w.name,
          rating: w.rating,
          faction: w.faction,
          alignment: w.alignment,
          brandId: w.brandId,
          wins: w.wins,
          losses: w.losses,
          draws: w.draws,
          injuryStatus: w.injuryStatus,
          moral: w.moral,
          currentTitlesNames: [] as string[]
        })),
        championships: championships.map(c => ({
          name: c.name,
          currentChampionId: c.currentChampionId
        }))
      };

      // Resolve title names for export
      for (const w of exportData.wrestlers) {
        const original = wrestlers.find(ow => ow.name === w.name);
        if (original?.currentTitlesIds) {
          const titles = await db.championships.bulkGet(original.currentTitlesIds);
          w.currentTitlesNames = titles.filter(t => t !== undefined).map(t => t!.name) as string[];
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wwe2kHub_config_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Error al exportar los datos');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.wrestlers) throw new Error('Formato de archivo inválido');

        const allTitles = await db.championships.toArray();
        const titleMap = new Map(allTitles.map(t => [t.name, t.id!]));

        for (const wData of data.wrestlers) {
          const existing = await db.wrestlers.where('name').equalsIgnoreCase(wData.name).first();
          if (existing) {
            const currentTitlesIds = (wData.currentTitlesNames || [])
              .map((name: string) => titleMap.get(name))
              .filter((id: number) => id !== undefined);

            await db.wrestlers.update(existing.id!, {
              rating: wData.rating ?? existing.rating,
              faction: wData.faction ?? existing.faction,
              alignment: wData.alignment ?? existing.alignment,
              wins: wData.wins ?? existing.wins,
              losses: wData.losses ?? existing.losses,
              draws: wData.draws ?? existing.draws,
              injuryStatus: wData.injuryStatus ?? existing.injuryStatus,
              moral: wData.moral ?? existing.moral,
              currentTitlesIds: currentTitlesIds.length > 0 ? currentTitlesIds : existing.currentTitlesIds
            });

            // Update championships table currentChampionId
            for (const titleId of currentTitlesIds) {
              await db.championships.update(titleId, { currentChampionId: existing.id });
            }
          }
        }

        alert('Configuración externa cargada correctamente. ¡Refresca la página para ver los cambios!');
        window.location.reload();
      } catch (error) {
        console.error('Import failed:', error);
        alert('Error al importar el archivo JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={styles.toolsContainer}>
      <button className={styles.toolButton} onClick={handleExport} title="Exportar configuración actual">
        📤 Exportar JSON
      </button>
      <label className={styles.toolButton}>
        📥 Importar JSON
        <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
      </label>
    </div>
  );
};

export default DatabaseTools;
