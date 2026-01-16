import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, description }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title || "Are you sure?"}</DialogTitle>
                    <DialogDescription>
                        {description || "This action cannot be undone."}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="destructive" onClick={onConfirm}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmDialog;
