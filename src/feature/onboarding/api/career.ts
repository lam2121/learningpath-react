import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000",
});

export const getJobRoles = async () => {
    const response = await api.get("/career/job-roles");

    return response.data;
};