"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ItemDeleteConfirmDialog({
  itemName,
  open,
  onCancel,
  onConfirm,
}: {
  itemName: string | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog onOpenChange={(next) => { if (!next) onCancel(); }} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer l&apos;objet</DialogTitle>
          <DialogDescription>
            {itemName ? `Supprimer definitivement "${itemName}" ?` : "Supprimer cet objet ?"} Cette action est
            irreversible. Si l&apos;objet est equipe, il sera d&apos;abord desequipe.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onCancel} type="button" variant="outline">
            Annuler
          </Button>
          <Button onClick={onConfirm} type="button" variant="destructive">
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
