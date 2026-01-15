import { ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TableView = ({ data, onEdit, onDelete }) => {
    return (
        <div className="rounded-md border bg-card">
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Empresa</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Vaga</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Etapa</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Data</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tempo</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Stack</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Local</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tipo</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Senioridade</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Links</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {data.length === 0 && (
                            <tr className="border-b transition-colors hover:bg-muted/50">
                                <td colSpan="11" className="p-4 text-center text-muted-foreground">
                                    No applications found.
                                </td>
                            </tr>
                        )}
                        {data.map(app => (
                            <tr key={app.id} className="border-b transition-colors hover:bg-muted/50 cursor-pointer" onClick={() => onEdit(app)}>
                                <td className="p-4 align-middle font-medium">{app.empresa}</td>
                                <td className="p-4 align-middle">{app.vaga}</td>
                                <td className="p-4 align-middle"><StatusBadge status={app.etapa} /></td>
                                <td className="p-4 align-middle">{formatDate(app.dataCandidatura)}</td>
                                <td className="p-4 align-middle">{app.tempoProcesso}d</td>
                                <td className="p-4 align-middle">
                                    <div className="flex flex-wrap gap-1">
                                        {app.stack?.slice(0, 3).map(s => (
                                            <span key={s} className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">{s}</span>
                                        ))}
                                        {app.stack?.length > 3 && <span className="text-xs text-muted-foreground">+{app.stack.length - 3}</span>}
                                    </div>
                                </td>
                                <td className="p-4 align-middle">{app.local}</td>
                                <td className="p-4 align-middle">{app.tipoVaga}</td>
                                <td className="p-4 align-middle">{app.senioridade}</td>
                                <td className="p-4 align-middle" onClick={e => e.stopPropagation()}>
                                    {app.linkVaga && (
                                        <a href={app.linkVaga} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                                            <ExternalLink size={14} />
                                        </a>
                                    )}
                                </td>
                                <td className="p-4 align-middle" onClick={e => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(app.id)}>
                                        <Trash2 size={14} className="text-destructive" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Simple Badge Helper
const StatusBadge = ({ status }) => {
    let colorClass = "bg-secondary text-secondary-foreground"; // default
    if (status === 'Enviei candidatura') colorClass = "bg-blue-500/15 text-blue-500";
    else if (status === 'Etapa com RH') colorClass = "bg-amber-500/15 text-amber-500";
    else if (status === 'Etapa técnica') colorClass = "bg-purple-500/15 text-purple-500";
    else if (status === 'Oferta') colorClass = "bg-emerald-500/15 text-emerald-500";
    else if (status === 'Negativa') colorClass = "bg-red-500/15 text-red-500";

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${colorClass}`}>
            {status}
        </span>
    );
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Use simple string logic to avoid timezone issues with Date() object if format is 'YYYY-MM-DD'
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateString;
};

export default TableView;
