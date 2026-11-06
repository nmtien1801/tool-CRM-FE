import ApiManager from "./ApiManager";

const ApiEcosystem = {
  getEcosystemEmployees: () => ApiManager.get('/ecosystem/employees'),
  setEcosystemEmployee: (id, ecosystem, assigned) =>
    ApiManager.put(`/ecosystem/employees/${id}/${ecosystem}`, { assigned }),
};

export default ApiEcosystem;
