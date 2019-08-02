export const generateUID = (): string => 
    Math.random().toString(36).substr(2);