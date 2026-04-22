import axios from '.'

export default {
    appointmentsInWeek()
    {
        return axios.get("/reports/appointments/week")
    },

    revenueInWeek()
    {
        return axios.get("/reports/revenue/week")
    },

    servicesPopular()
    {
        return axios.get("/reports/services/popular")
    },

    professionalsTop()
    {
        return axios.get("/reports/professionals/top")
    }
}