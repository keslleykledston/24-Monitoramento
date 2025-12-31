// testStore.ts

export interface SampleTarget {
    id: string;
    name: string;
}

const sampleTargets: SampleTarget[] = [{ id: "1", name: "Test 1" }];

// Acesso simulado
export function fetchTargets() {
    return sampleTargets;
}