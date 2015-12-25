import State from "../../../src/state";
import Sync from "../../../src/sync";
import express from "express";
import { uniqueId } from "lodash";
import bodyParser from "body-parser";

const app = express(),
      state = new State(),
      sync = new Sync(state);

app.use(bodyParser.json());
app.use(express.static("../client"));

app.get("/connect", (req, res) => {
  const id = uniqueId();
  sync.addPeer(id);
  res.json({
    clientId: id,
    initialState: state
  });
});

app.post("/sync", (req, res) => {
  const answer = sync.receive(req.body.clientId, req.body.patch, false);
  res.json(answer);
});

var server = app.listen(3000, function () {
  const host = server.address().address,
        port = server.address().port;
  console.log('Listening at http://%s:%s', host, port);
});
