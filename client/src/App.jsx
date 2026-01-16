import { useState, useEffect } from 'react';
import { fetchApplications, createApplication, updateApplication, deleteApplication } from './api';
import './App.css';
import { Plus, Trello, Table as TableIcon, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TableView from './components/TableView';
import BoardView from './components/BoardView';
import ApplicationModal from './components/ApplicationModal';
import SettingsModal from './components/SettingsModal';
import ConfirmDialog from './components/ConfirmDialog';
import { Toaster, toast } from 'sonner';

function App() {
  const [applications, setApplications] = useState([]);
  const [view, setView] = useState('table'); // 'table' | 'board'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => { },
  });

  const loadData = async () => {
    try {
      const data = await fetchApplications();
      setApplications(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load applications.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (data) => {
    try {
      if (editingApp) {
        await updateApplication(editingApp.id, data);
        toast.success('Application updated successfully!');
      } else {
        await createApplication(data);
        toast.success('Application created successfully!');
      }
      setIsModalOpen(false);
      setEditingApp(null);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error saving application');
    }
  };

  const handleDeleteClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Application',
      description: 'Are you sure you want to delete this application? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteApplication(id);
          toast.success('Application deleted successfully');
          loadData();
        } catch (err) {
          console.error(err);
          toast.error('Failed to delete application');
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
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
            onDelete={handleDeleteClick}
          />
        )}
        {view === 'board' && (
          <BoardView
            data={applications}
            onEdit={openEdit}
            onUpdateStatus={async (id, newStatus) => {
              try {
                await updateApplication(id, { etapa: newStatus });
                loadData();
              } catch (error) {
                toast.error('Failed to update status');
              }
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
      />

      <Toaster />
    </div>
  );
}

export default App;
