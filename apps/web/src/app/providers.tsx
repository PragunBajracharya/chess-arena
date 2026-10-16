"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());
    return (
        <QueryClientProvider client={queryClient}>
            {/* One drag-and-drop backend for the whole app: the HTML5 backend allows only one at a time. */}
            <DndProvider backend={HTML5Backend}>{children}</DndProvider>
        </QueryClientProvider>
    );
}
