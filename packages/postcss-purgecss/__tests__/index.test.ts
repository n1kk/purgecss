import path from "path";
import purgeCSSPlugin from "../src";

const fs = require("fs");
const postcss = require("postcss");

describe("Purgecss postcss plugin", () => {
  const files = ["simple", "font-keyframes"];

  for (const file of files) {
    it(`remove unused css with content option successfully: ${file}`, done => {
      const input = fs
        .readFileSync(`${__dirname}/fixtures/src/${file}/${file}.css`)
        .toString();
      const expected = fs
        .readFileSync(`${__dirname}/fixtures/expected/${file}.css`)
        .toString();
      postcss([
        purgeCSSPlugin({
          content: [`${__dirname}/fixtures/src/${file}/${file}.html`],
          fontFace: true,
          keyframes: true
        })
      ])
        .process(input, { from: undefined })
        .then((result: any) => {
          expect(result.css).toBe(expected);
          expect(result.warnings().length).toBe(0);
          done();
        });
    });
  }

  for (const file of files) {
    const sourceFileName = `src/${file}/${file}.css`;
    const contentFileName = `src/${file}/${file}.html`;
    const sourceFilePath = path.resolve(sourceFileName);
    const inputFilePath = path.resolve(__dirname, "fixtures", sourceFileName);
    const contentFilePath = path.resolve(__dirname, "fixtures", contentFileName);
    const expectedFilePath = path.resolve(__dirname, `fixtures/expected/${file}.css`);

    const input = fs.readFileSync(inputFilePath).toString();
    const expected = fs.readFileSync(expectedFilePath).toString();

    it(`remove unused css with contentFunction option successfully: ${file}`, done => {
      const contentFunction = jest.fn().mockReturnValue([contentFilePath]);

      postcss([
        purgeCSSPlugin({
          contentFunction,
          fontFace: true,
          keyframes: true
        })
      ])
        .process(input, { from: sourceFileName })
        .then((result: any) => {
          expect(result.css).toBe(expected);
          expect(result.warnings().length).toBe(0);
          expect(contentFunction).toHaveBeenCalledTimes(1);
          expect(contentFunction.mock.calls[0][0]).toContain(sourceFileName);
          expect(contentFunction.mock.results[0].value[0]).toBe(contentFilePath);
          done();
        });
    });

    it(`register content files as dependencies in webpack if flag is set: ${file}`, done => {
      const contentFunction = jest.fn().mockReturnValue([contentFilePath]);

      postcss([
        purgeCSSPlugin({
          contentFunction,
          fontFace: true,
          keyframes: true,
          registerDependencies: true
        })
      ])
        .process(input, {from: sourceFileName})
        .then((result: any) => {
          expect(result.messages.length).toBe(1);
          expect(result.messages[0]).toEqual({
            type: "dependency",
            plugin: "postcss-purgecss",
            file: contentFilePath,
            parent: sourceFilePath
          });
          done();
        });
    });

    it(`not register content files as dependencies in webpack if flag is not set: ${file}`, done => {
      const contentFunction = jest.fn().mockReturnValue([contentFilePath]);

      postcss([
        purgeCSSPlugin({
          contentFunction,
          fontFace: true,
          keyframes: true,
          registerDependencies: false
        })
      ])
        .process(input, {from: sourceFileName})
        .then((result: any) => {
          expect(result.messages.length).toBe(0);
          done();
        });
    });
  }

  for (const file of ["simple"]) {
    it(`queues messages when using reject flag: ${file}`, done => {
      const input = fs
        .readFileSync(`${__dirname}/fixtures/src/${file}/${file}.css`)
        .toString();
      const expected = fs
        .readFileSync(`${__dirname}/fixtures/expected/${file}.css`)
        .toString();
      postcss([
        purgeCSSPlugin({
          content: [`${__dirname}/fixtures/src/${file}/${file}.html`],
          rejected: true
        })
      ])
        .process(input, { from: undefined })
        .then((result: any) => {
          expect(result.css).toBe(expected);
          expect(result.warnings().length).toBe(0);
          expect(result.messages.length).toBeGreaterThan(0);
          expect(result.messages[0].text).toMatch(/unused-class/);
          expect(result.messages[0].text).toMatch(/another-one-not-found/);
          done();
        });
    });
  }
});
