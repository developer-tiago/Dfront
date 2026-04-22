import axios from ".";

export default {
    update(data) {
        return axios.put("/appointment-items", data)
    }
}