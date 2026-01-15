import { useState, useEffect } from 'react';
import { fetchApplications, createApplication, updateApplication, deleteApplication } from './api';
import './App.css';
import { Plus, Trello, Table as TableIcon, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TableView from './components/TableView';
import BoardView from './components/BoardView';
import ApplicationModal from './components/ApplicationModal';
import SettingsModal from './components/SettingsModal';
import { Toaster } from "@/components/ui/sonner"

function App() {
  const [applications, setApplications] = useState([]);
  const [view, setView] = useState('table'); // 'table' | 'board'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);

  const loadData = async () => {
    try {
      const data = await fetchApplications();
      setApplications(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (data) => {
    try {
      if (editingApp) {
        await updateApplication(editingApp.id, data);
      } else {
        await createApplication(data);
      }
      setIsModalOpen(false);
      setEditingApp(null);
      loadData();
    } catch (err) {
      alert('Error saving application');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure?')) {
      await deleteApplication(id);
      loadData();
    }
  };

  const openNew = () => {
    setEditingApp(null);
    setIsModalOpen(true);
  };

  const openEdit = (app) => {
    setEditingApp(app);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <header className="flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Controle de Candidaturas</h1>
          <p className="text-muted-foreground mt-2">Gerencie seus processos seletivos em um só lugar.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} title="Configurações">
            <Settings size={20} />
          </Button>
          <div className="bg-muted p-1 rounded-lg flex items-center">
            <button
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'table' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setView('table')}
              title="Table View"
            >
              <TableIcon size={16} /> Todas
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'board' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setView('board')}
              title="Board View"
            >
              <Trello size={16} /> Por etapa
            </button>
          </div>
          <Button onClick={openNew}>
            <Plus size={16} className="mr-2" /> Nova Candidatura
          </Button>
        </div>
      </header>

      <main>
        {view === 'table' && (
          <TableView
            data={applications}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
        {view === 'board' && (
          <BoardView
            data={applications}
            onEdit={openEdit}
            onUpdateStatus={async (id, newStatus) => {
              await updateApplication(id, { etapa: newStatus });
              loadData();
            }}
          />
        )}
      </main>

      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        app={editingApp}
        onSave={handleSave}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <Toaster />
    </div>
  );
}

export default App;
