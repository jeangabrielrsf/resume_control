import { useState, useEffect } from 'react';
import { X, Save, Wand2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTags, generateResume } from '../api';
import { toast } from 'sonner';

const ApplicationModal = ({ isOpen, onClose, app, onSave }) => {
    const [formData, setFormData] = useState({
        empresa: '',
        vaga: '',
        linkVaga: '',
        dataCandidatura: new Date().toISOString().split('T')[0],
        stack: [],
        etapa: 'Enviei candidatura',
        senioridade: 'Júnior',
        local: 'Brasil',
        tipoVaga: 'Remoto',
        observacoes: '',
        description: ''
    });

    const [stackInput, setStackInput] = useState('');
    const [availableTags, setAvailableTags] = useState([]);

    useEffect(() => {
        if (isOpen) {
            getTags().then(setAvailableTags);
        }
    }, [isOpen]);

    useEffect(() => {
        if (app) {
            setFormData({
                ...app,
                dataCandidatura: app.dataCandidatura ? app.dataCandidatura.split('T')[0] : ''
            });
        } else {
            setFormData({
                empresa: '',
                vaga: '',
                linkVaga: '',
                dataCandidatura: new Date().toISOString().split('T')[0],
                stack: [],
                etapa: 'Enviei candidatura',
                senioridade: 'Júnior',
                local: 'Brasil',
                tipoVaga: 'Remoto',
                observacoes: '',
                description: ''
            });
        }
    }, [app]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddStack = (e) => {
        if (e.key === 'Enter' && stackInput) {
            e.preventDefault();
            if (!formData.stack.includes(stackInput)) {
                setFormData(prev => ({ ...prev, stack: [...(prev.stack || []), stackInput] }));
            }
            setStackInput('');
        }
    };

    const removeStack = (s) => {
        setFormData(prev => ({ ...prev, stack: prev.stack.filter(item => item !== s) }));
    };

    const handleSubmit = (e) => {
        // Prevent default form submission if wrapped in <form>
        e.preventDefault();
        onSave(formData);
    };

    // Helper for Styled Select (mimicking Input)
    const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    // --- AI Logic ---
    const [generatedResume, setGeneratedResume] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateResume = async () => {
        if (!formData.description) {
            toast.warning('Por favor, preencha a Descrição da Vaga antes de gerar.');
            return;
        }
        setIsGenerating(true);
        try {
            const resume = await generateResume(formData.description);
            setGeneratedResume(resume);
            toast.success("Currículo gerado com sucesso!");
        } catch (err) {
            toast.error('Erro ao gerar currículo. Verifique se o Currículo Base está configurado.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{app ? 'Editar Candidatura' : 'Nova Candidatura'}</DialogTitle>
                    <DialogDescription className="sr-only">Formulário de detalhes da candidatura e geração de currículo.</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="application" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="application">Detalhes da Vaga</TabsTrigger>
                        <TabsTrigger value="resume">Currículo (AI)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="application" className="flex-1 overflow-y-auto pr-2">
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="empresa">Empresa</Label>
                                    <Input id="empresa" name="empresa" value={formData.empresa} onChange={handleChange} placeholder="Nome da empresa" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vaga">Vaga</Label>
                                    <Input id="vaga" name="vaga" value={formData.vaga} onChange={handleChange} placeholder="Ex: Frontend Developer" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="etapa">Etapa</Label>
                                    <select id="etapa" name="etapa" value={formData.etapa} onChange={handleChange} className={selectClass}>
                                        <option>Enviei candidatura</option>
                                        <option>Etapa com RH</option>
                                        <option>Etapa técnica</option>
                                        <option>Oferta</option>
                                        <option>Negativa</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="senioridade">Senioridade</Label>
                                    <select id="senioridade" name="senioridade" value={formData.senioridade} onChange={handleChange} className={selectClass}>
                                        <option>Estágio</option>
                                        <option>Júnior</option>
                                        <option>Pleno</option>
                                        <option>Sênior</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dataCandidatura">Data</Label>
                                    <Input type="date" id="dataCandidatura" name="dataCandidatura" value={formData.dataCandidatura} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="stack-input">Stack (Technology)</Label>
                                <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] items-center">
                                    {formData.stack?.map(s => (
                                        <span key={s} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs flex items-center gap-1">
                                            {s}
                                            <button
                                                onClick={() => removeStack(s)}
                                                className="focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-full"
                                                aria-label={`Remove ${s}`}
                                                type="button"
                                            >
                                                <X size={12} className="cursor-pointer hover:text-destructive" />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        id="stack-input"
                                        list="stack-suggestions"
                                        className="bg-transparent outline-none flex-1 min-w-[100px] text-sm"
                                        value={stackInput}
                                        onChange={e => setStackInput(e.target.value)}
                                        onKeyDown={handleAddStack}
                                        placeholder="Add tec (Enter)..."
                                    />
                                    <datalist id="stack-suggestions">
                                        {availableTags.map(tag => (
                                            <option key={tag} value={tag} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="local">Local</Label>
                                    <Input id="local" name="local" value={formData.local} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tipoVaga">Tipo</Label>
                                    <select id="tipoVaga" name="tipoVaga" value={formData.tipoVaga} onChange={handleChange} className={selectClass}>
                                        <option>Remoto</option>
                                        <option>Híbrido</option>
                                        <option>Presencial</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="linkVaga">Link da Vaga</Label>
                                <Input id="linkVaga" name="linkVaga" value={formData.linkVaga} onChange={handleChange} placeholder="https://..." />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição / Observações</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Cole a descrição da vaga aqui..."
                                    className="min-h-[150px]"
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="resume" className="flex-1 overflow-y-auto pr-2 space-y-4 py-4">
                        <div className="bg-muted p-4 rounded-md text-sm text-muted-foreground border">
                            <p>Aqui você pode gerar uma versão personalizada do seu currículo base (LaTeX) focada nesta vaga.</p>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={handleGenerateResume} disabled={isGenerating}>
                                {isGenerating ? <Wand2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                {isGenerating ? 'Gerando...' : 'Gerar Currículo Personalizado'}
                            </Button>
                        </div>

                        {generatedResume && (
                            <div className="space-y-2">
                                <Label htmlFor="generatedResume">Código LaTeX Gerado</Label>
                                <Textarea
                                    id="generatedResume"
                                    value={generatedResume}
                                    readOnly
                                    className="font-mono min-h-[400px] text-xs bg-slate-950 text-slate-50"
                                />
                                <p className="text-xs text-muted-foreground">Copie este código e compile no seu editor LaTeX preferido (Overleaf, etc).</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit}>
                        <Save size={16} className="mr-2" /> Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ApplicationModal;
