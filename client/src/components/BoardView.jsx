import { Calendar } from 'lucide-react';

const STATUSES = ['Enviei candidatura', 'Etapa com RH', 'Etapa técnica', 'Oferta', 'Negativa'];

const BoardView = ({ data, onEdit }) => {
    return (
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-140px)]">
            {STATUSES.map(status => {
                const apps = data.filter(a => a.etapa === status);
                return (
                    <div key={status} className="w-[320px] shrink-0 flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm h-full">
                        <div className="flex flex-col space-y-1.5 p-4 pb-2 border-b bg-muted/20">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${getStatusDot(status)}`}></span>
                                    {status}
                                </h3>
                                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{apps.length}</span>
                            </div>
                        </div>
                        <div className="p-4 pt-4 flex-1 overflow-y-auto space-y-3">
                            {apps.map(app => (
                                <div
                                    key={app.id}
                                    className="rounded-lg border bg-background text-card-foreground shadow-sm hover:border-primary/50 transition-colors cursor-pointer p-4 space-y-2"
                                    onClick={() => onEdit(app)}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="text-sm text-muted-foreground font-medium">{app.empresa}</span>
                                    </div>
                                    <h4 className="font-semibold">{app.vaga}</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {app.senioridade && <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold border-transparent bg-secondary text-secondary-foreground">{app.senioridade}</span>}
                                        {app.tempoProcesso > 0 && <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold border-transparent bg-muted text-muted-foreground">{app.tempoProcesso}d</span>}
                                    </div>
                                    <div className="flex items-center text-xs text-muted-foreground pt-2">
                                        <Calendar size={12} className="mr-1" />
                                        {app.dataCandidatura ? app.dataCandidatura.split('T')[0].split('-').reverse().join('/') : '-'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const getStatusDot = (status) => {
    switch (status) {
        case 'Enviei candidatura': return 'bg-blue-500';
        case 'Etapa com RH': return 'bg-amber-500';
        case 'Etapa técnica': return 'bg-purple-500';
        case 'Oferta': return 'bg-emerald-500';
        case 'Negativa': return 'bg-red-500';
        default: return 'bg-gray-500';
    }
};

export default BoardView;
