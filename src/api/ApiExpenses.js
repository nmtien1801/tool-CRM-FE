import ApiManager from "./ApiManager";

const ApiExpenses = {
  getExpenses: () => ApiManager.get("/expenses"),
  createExpense: (data) => ApiManager.post("/expenses", data),
  updateExpense: (id, data) => ApiManager.put(`/expenses/${id}`, data),
  deleteExpense: (id) => ApiManager.delete(`/expenses/${id}`),
};

export default ApiExpenses;
