import * as ActionCable from "@rails/actioncable";

const cable = ActionCable.createConsumer("/cable");

export default cable;
