// targetStore.ts

export interface Target {
    id: string;   // Identificador único do alvo
    name: string; // Nome do alvo
}

// Array que mantém a lista de alvos
let targets: Target[] = [];

// Função que retorna todos os alvos
export const getTargets = () => {
    return targets; // Retorna a lista de alvos
};

// Função que adiciona um alvo à lista
export const addTarget = (target: Target) => {
    targets.push(target); // Adiciona o alvo ao array
};

// Função que remove um alvo da lista pelo ID
export const removeTarget = (id: string) => {
    const index = targets.findIndex(t => t.id === id); // Encontrar índice
    if (index > -1) {
        targets.splice(index, 1); // Remove o alvo
    }
};