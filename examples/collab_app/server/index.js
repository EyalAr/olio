import State from "../../../src/state";
import Sync from "../../../src/sync";
import express from "express";
import { uniqueId, reduce } from "lodash";
import bodyParser from "body-parser";

const app = express(),
      state = new State({
        shapes: {}
      }),
      sync = new Sync(state),
      history = [];

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
  const start = Date.now(),
        patch = req.body.patch,
        clientId = req.body.clientId,
        answer = sync.receive(req.body.clientId, req.body.patch, false),
        end = Date.now(),
        duration = end - start;
  if (patch.length || answer.length || duration > 100) {
    history.push({
      clientId,
      start,
      end,
      patch,
      answer,
      duration
    });
  }
  res.json(answer);
});

app.get("/history", (req, res) => {
  res.json(history);
});

app.get("/state", (req, res) => {
  res.json({
    server: state.state,
    clients: reduce(sync.peers, (res, client, clientId) => {
      res[clientId] = client.state;
      return res;
    }, {})
  });
});

var server = app.listen(3000, function () {
  const host = server.address().address,
        port = server.address().port;
  console.log('Listening at http://%s:%s', host, port);
});
