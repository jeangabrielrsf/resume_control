import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getSettings, saveSettings } from '../api';

import { toast } from 'sonner';

const SettingsModal = ({ isOpen, onClose }) => {
    const [baseResume, setBaseResume] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen]);

    const loadSettings = async () => {
        try {
            const settings = await getSettings();
            setBaseResume(settings.baseResume || '');
        } catch (err) {
            console.error("Failed to load settings", err);
            toast.error("Erro ao carregar configurações.");
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await saveSettings({ baseResume });
            toast.success("Currículo base salvo com sucesso!");
            onClose();
        } catch (err) {
            toast.error("Erro ao salvar o currículo base.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Configurações / Base Resume</DialogTitle>
                    <DialogDescription className="sr-only">Gerencie seu currículo base em LaTeX.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Currículo Base (LaTeX)</Label>
                        <div className="text-xs text-muted-foreground mb-2">
                            Cole aqui o código LaTeX do seu currículo principal. A IA usará este modelo como base para gerar versões personalizadas.
                        </div>
                        <Textarea
                            value={baseResume}
                            onChange={e => setBaseResume(e.target.value)}
                            placeholder="\documentclass{article}..."
                            className="font-mono text-xs min-h-[400px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        <Save size={16} className="mr-2" /> Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SettingsModal;
