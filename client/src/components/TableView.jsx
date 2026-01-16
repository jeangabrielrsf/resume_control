import { ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TableView = ({ data, onEdit, onDelete }) => {
    const handleKeyDown = (e, app) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onEdit(app);
        }
    };

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
                            <tr
                                key={app.id}
                                className="border-b transition-colors hover:bg-muted/50 cursor-pointer focus-visible:bg-muted focus-visible:outline-none"
                                onClick={() => onEdit(app)}
                                onKeyDown={(e) => handleKeyDown(e, app)}
                                tabIndex="0"
                                role="button"
                                aria-label={`Edit application for ${app.vaga} at ${app.empresa}`}
                            >
                                <td className="p-4 align-middle font-medium">{app.empresa}</td>
                                <td className="p-4 align-middle">{app.vaga}</td>
                                <td className="p-4 align-middle"><StatusBadge status={app.etapa} /></td>
                                <td className="p-4 align-middle">{formatDate(app.dataCandidatura)}</td>
                                <td className="p-4 align-middle">{app.tempoProcesso}d</td>
                                <td className="p-4 align-middle">
                                    <div className="flex flex-wrap gap-1">
                                        {app.stack?.slice(0, 3).map(s => (
                                            <span key={s} className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">{s}</span>
                                        ))}
                                        {app.stack?.length > 3 && <span className="text-xs text-muted-foreground">+{app.stack.length - 3}</span>}
                                    </div>
                                </td>
                                <td className="p-4 align-middle">{app.local}</td>
                                <td className="p-4 align-middle">{app.tipoVaga}</td>
                                <td className="p-4 align-middle">{app.senioridade}</td>
                                <td className="p-4 align-middle" onClick={e => e.stopPropagation()}>
                                    {app.linkVaga && (
                                        <a
                                            href={app.linkVaga}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-muted-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-ring rounded-sm outline-none"
                                            aria-label="Open job link"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                    )}
                                </td>
                                <td className="p-4 align-middle" onClick={e => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(app.id)}
                                        aria-label="Delete application"
                                    >
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
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent ${colorClass}`}>
            {status}
        </span>
    );
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    // Use Intl.DateTimeFormat for consistent localized formatting
    // Assuming the input dateString is ISO or similar standard format
    // Adjusting for timezone offset often requires more robust lib like date-fns, 
    // but for simple display of YYYY-MM-DD from server (often UTC or local), we can try to be safe.
    // If the string is YYYY-MM-DD, we can parse it manually to avoid timezone shifts on simple dates.

    // Fallback to simple parse if time is not critical
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    } catch (e) {
        return dateString;
    }
};

export default TableView;
