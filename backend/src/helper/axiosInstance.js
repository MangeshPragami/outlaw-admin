import axios from "axios";

export const createIdeaAxiosInstance = axios.create({
    baseURL: "https://llpa8nsk0j.execute-api.ap-south-1.amazonaws.com/Prod",
    headers: {
        "Content-Type": "application/json",
        "x-outlaw-api-key": "P1N8H3Q5Z7R9X2C4V6B0"
    },
    timeout: 60_000
});

export const lensSelectorAxiosInstance = axios.create({
    baseURL: "https://th7vbqtvl6.execute-api.ap-south-1.amazonaws.com/dev",
    headers: {
        "Content-Type": "application/json",
        "x-outlaw-api-key": "P1N8H3Q5Z7R9X2C4V6B0"
    },
    timeout: 60_000
});

export const surveyGeneratorAxiosInstance = axios.create({
    baseURL: "https://77jnlpodc3.execute-api.ap-south-1.amazonaws.com/Stage",
    headers: {
        "Content-Type": "application/json",
        "x-outlaw-api-key": "P1N8H3Q5Z7R9X2C4V6B0"
    },
    timeout: 60_000
});

export const matchmakingAxiosInstance = axios.create({
    baseURL: "https://arf8dtctzd.execute-api.ap-south-1.amazonaws.com/Prod",
    headers: {
        "Content-Type": "application/json",
        "x-outlaw-api-key": "P1N8H3Q5Z7R9X2C4V6B0"
    },
    timeout: 60_000
});
