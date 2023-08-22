import { OpenAiService } from ':src/shared/openai.service';
import { Body, Controller, Post } from '@nestjs/common';
import { ObjectResponse, RunActionWithPromptInput, RunActionWithPromptOutput } from './types';

@Controller('/v1/actions')
export class ActionsController {
  constructor(private openAiService: OpenAiService) {}

  @Post('/run')
  async runAction(@Body() body: RunActionWithPromptInput): Promise<ObjectResponse<RunActionWithPromptOutput>> {
    try {
      const result = await this.openAiService.runAction(body.prompt);

      return {
        status: 'success',
        data: result,
      };
    } catch (error: any) {
      return {
        status: 'error',
        error: {
          message: error.message,
        },
      };
    }
  }
}
