import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InputParametersObject, OperationContext, OutputParametersObject } from './types';
import { ActionSchemaType } from 'lib';
import { Connector } from './connector';

@Injectable()
export class Action {
  constructor(private actionSchema: ActionSchemaType, private _connector: Connector) {}

  get key(): string {
    return this.actionSchema.key;
  }

  get schema(): ActionSchemaType {
    return this.actionSchema;
  }

  get connector(): Connector {
    return this._connector;
  }

  // TODO: Move to the shared library
  async runAction(inputParameters: InputParametersObject): Promise<OutputParametersObject> {
    this.validateInput(inputParameters);

    let output: OutputParametersObject;
    const operationContext = this.getOperationContext(inputParameters);
    try {
      output = (await this.schema.operation.handler(operationContext)) as OutputParametersObject;
    } catch (error: any) {
      console.error(JSON.stringify(error));
      throw new HttpException(`[Action execution error] ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    this.validateOutput(output);
    return output;
  }

  // TODO: Move to the shared library
  private getOperationContext(inputParameters: InputParametersObject): OperationContext {
    return {
      connector: this.connector.schema,
      action: this.actionSchema,
      inputParameters: inputParameters,
      configurationParameters: this.connector.configurationParameters,
    };
  }

  // TODO: Move to the shared library
  private validateInput(input: InputParametersObject): void {
    const inputParametersSchema = this.schema.inputParameters;

    inputParametersSchema.forEach((inputSchema) => {
      // Validate if all required input parameters are present
      if (inputSchema.validation && inputSchema.validation.required && !input[inputSchema.key]) {
        throw new HttpException(
          `Input parameter '${inputSchema.key}' is required, but the value is empty or not provided.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate if the type of the input parameter is correct
      if (inputSchema.type !== typeof input[inputSchema.key]) {
        throw new HttpException(
          `The input parameter '${inputSchema.key}' has incorrect type. The expected type is '${
            inputSchema.type
          }', but the actual value has the type '${typeof input[inputSchema.key]}'.`,
          HttpStatus.BAD_REQUEST,
        );
      }
    });

    // Validate if there are no extra input parameters that are not defined in the schema
    Object.keys(input).forEach((inputKey) => {
      if (!inputParametersSchema.find((inputSchema) => inputSchema.key === inputKey)) {
        throw new HttpException(
          `Input parameter '${inputKey}' is not defined in the action schema.`,
          HttpStatus.BAD_REQUEST,
        );
      }
    });
  }

  // TODO: Move to the shared library
  private validateOutput(output: OutputParametersObject): void {
    const outputParametersSchema = this.schema.outputParameters;

    outputParametersSchema.forEach((outputSchema) => {
      // Validate if all required output parameters are present
      if (outputSchema.validation && outputSchema.validation.required && !output[outputSchema.key]) {
        throw new HttpException(
          `The action has been run. However, the output is not valid. The output parameter '${outputSchema.key}' is required, but the value is empty or not provided.`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Validate if the type of the output parameter is correct
      if (outputSchema.type !== typeof output[outputSchema.key]) {
        throw new HttpException(
          `The action has been run. However, the output is not valid. The output parameter '${
            outputSchema.key
          }' has an incorrect type. The expected type is '${
            outputSchema.type
          }', but the actual value has the type '${typeof output[outputSchema.key]}'.`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });

    // Validate if there are no extra output parameters that are not defined in the schema
    Object.keys(output).forEach((outputKey) => {
      if (!outputParametersSchema.find((outputSchema) => outputSchema.key === outputKey)) {
        throw new HttpException(
          `The action has been run. However, the output is not valid. The output parameter '${outputKey}' is not defined in the action schema.`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });
  }
}
