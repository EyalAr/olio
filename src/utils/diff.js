import fjp from "fast-json-patch";

export default function diff(from, to) {
  return fjp.compare(from.toJSON(), to.toJSON());
}
