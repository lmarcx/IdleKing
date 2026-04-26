import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorldsPage() {
  return (
    <div className="space-y-4">
      <h1 className="ik-title text-2xl font-semibold">Worlds</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Original Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/game/worlds/original" className="text-sm underline underline-offset-4">
              Enter Original World
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alternative Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/game/worlds/alt" className="text-sm underline underline-offset-4">
              Enter Alt World
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
