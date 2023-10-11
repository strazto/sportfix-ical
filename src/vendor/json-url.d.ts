// https://github.com/masotime/json-url/issues/7#issue-346898908
declare module "json-url" {
  interface Codec {
    compress: (obj: object) => Promise<string>;
    decompress: (str: string) => Promise<object>;
    stats: (
      obj: object
    ) => Promise<{ rawencoded: any; compressedencoded: any; compression: any }>;
  }

  const jsonurl: (codecName: string) => Codec;

  export default jsonurl;
}
