import ApiManager from "./ApiManager";

const ApiDashboard = {
  getBusinessReport: (params) => ApiManager.get("/dashboard/business", params),
  getMarketingReport: (params) => ApiManager.get("/dashboard/marketing", params),
};

export default ApiDashboard;
