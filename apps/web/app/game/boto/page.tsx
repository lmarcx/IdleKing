"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function BotoPage() {
  const choose = (choice: string) => {
    toast.info(`Choice selected: ${choice}`);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Boto</h1>
      <Card>
        <CardHeader>
          <CardTitle>Companion Console</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
            [ BOTO UNIT ONLINE ]
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => choose("Scout")}>Scout surroundings</Button>
            <Button variant="secondary" onClick={() => choose("Gather")}>Gather local hints</Button>
            <Button variant="outline" onClick={() => choose("Calibrate")}>Calibrate systems</Button>
            <Button variant="outline" onClick={() => choose("Silence")}>Standby mode</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
