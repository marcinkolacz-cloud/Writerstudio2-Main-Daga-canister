import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Analysis {
  'id' : bigint,
  'provider' : string,
  'analysisType' : string,
  'createdAt' : bigint,
  'bookId' : bigint,
  'chapterId' : [] | [bigint],
  'resultContent' : string,
}
export interface Book {
  'id' : bigint,
  'title' : string,
  'ownerId' : Principal,
  'authorSummary' : string,
  'characters' : string,
  'description' : string,
  'updatedAt' : bigint,
  'themes' : string,
  'keyContext' : string,
  'category' : string,
  'ageCategory' : string,
}
export interface BookExport {
  'chatArchives' : Array<ChatArchive>,
  'chatSessionMessages' : Array<ChatSessionMessage>,
  'book' : Book,
  'chatMessages' : Array<ChatMessage>,
  'annotations' : Array<TextAnnotation>,
  'chapters' : Array<Chapter>,
  'chatSessions' : Array<ChatSession>,
  'comments' : Array<Comment>,
  'analyses' : Array<Analysis>,
}
export interface Chapter {
  'id' : bigint,
  'charCount' : bigint,
  'title' : string,
  'indentFirstLine' : bigint,
  'content' : string,
  'indentRight' : bigint,
  'wordCount' : bigint,
  'indentLeft' : bigint,
  'createdAt' : bigint,
  'bookId' : bigint,
  'updatedAt' : bigint,
  'sessionId' : string,
  'orderIndex' : bigint,
}
export interface ChatArchive {
  'id' : bigint,
  'title' : string,
  'createdAt' : bigint,
  'bookId' : bigint,
  'summary' : string,
  'updatedAt' : bigint,
  'sessionId' : string,
}
export interface ChatMessage {
  'id' : bigint,
  'content' : string,
  'provider' : string,
  'createdAt' : bigint,
  'role' : string,
  'bookId' : bigint,
  'sessionId' : string,
}
export interface ChatSession {
  'id' : bigint,
  'title' : string,
  'createdAt' : bigint,
  'chapterId' : bigint,
}
export interface ChatSessionMessage {
  'id' : bigint,
  'content' : string,
  'createdAt' : bigint,
  'role' : string,
  'sessionId' : bigint,
}
export interface Comment {
  'id' : bigint,
  'content' : string,
  'createdAt' : bigint,
  'chapterId' : bigint,
  'anchorText' : string,
}
export interface DailyWritingStat {
  'id' : bigint,
  'activeMinutes' : bigint,
  'ownerId' : Principal,
  'wordsAdded' : bigint,
  'date' : string,
  'bookId' : bigint,
  'netWords' : bigint,
  'sessionCount' : bigint,
  'wordsRemoved' : bigint,
}
export interface ExportMetadataResponse {
  'owner' : Principal,
  'bookCount' : bigint,
  'exportedAt' : bigint,
}
export interface HourlyActivityStat {
  'id' : bigint,
  'ownerId' : Principal,
  'wordsAdded' : bigint,
  'hour' : bigint,
}
export interface InviteCode {
  'code' : string,
  'usedAt' : [] | [bigint],
  'usedBy' : [] | [Principal],
  'createdAt' : bigint,
}
export interface PendingUpload {
  'id' : bigint,
  'voice' : string,
  'createdAt' : bigint,
  'receivedChunks' : bigint,
  'bookId' : bigint,
  'chapterId' : bigint,
  'totalChunks' : bigint,
}
export interface Recording {
  'id' : bigint,
  'voice' : string,
  'createdAt' : bigint,
  'audioData' : Uint8Array | number[],
  'bookId' : bigint,
  'chapterId' : bigint,
}
export interface TextAnnotation {
  'id' : bigint,
  'alternativeProposal' : [] | [string],
  'explanation' : string,
  'color' : string,
  'text' : string,
  'approved' : boolean,
  'analysisId' : bigint,
  'proposal' : string,
}
export interface _SERVICE {
  '__adminPrincipal' : ActorMethod<[], [] | [Principal]>,
  '__analyses' : ActorMethod<
    [[] | [bigint], [] | [bigint]],
    Array<[bigint, Analysis]>
  >,
  '__annotations' : ActorMethod<
    [[] | [bigint], [] | [bigint]],
    Array<[bigint, TextAnnotation]>
  >,
  '__books' : ActorMethod<
    [[] | [bigint], [] | [bigint]],
    Array<[bigint, Book]>
  >,
  '__chapters' : ActorMethod<
    [[] | [bigint], [] | [bigint]],
    Array<[bigint, Chapter]>
  >,
  '__chatArchives' : ActorMethod<
    [[] | [bigint], [] | [bigint]],
    Array<[bigint, ChatArchive]>
  >,
  '__chatMessages' : ActorMethod<
    [[] | [bigint], [] | [bigint]],
    Array<[bigint, ChatMessage]>
  >,
  '__chatSessionMessages' : ActorMethod<
    [[] | [bigint], [] | [bigint]],
    Array<[bigint, ChatSessionMessage]>
  >,
  '__chatSessions' : ActorMethod<
    [[] | [bigint], [] | [bigint]],
    Array<[bigint, ChatSession]>
  >,
  '__comments' : ActorMethod<
    [[] | [bigint], [] | [bigint]],
    Array<[bigint, Comment]>
  >,
  '__hourlyStats' : ActorMethod<
    [[] | [string], [] | [bigint]],
    Array<[string, HourlyActivityStat]>
  >,
  '__inviteCodes' : ActorMethod<
    [[] | [string], [] | [bigint]],
    Array<[string, InviteCode]>
  >,
  '__nextAnalysisId' : ActorMethod<[], bigint>,
  '__nextAnnotationId' : ActorMethod<[], bigint>,
  '__nextBookId' : ActorMethod<[], bigint>,
  '__nextChapterId' : ActorMethod<[], bigint>,
  '__nextChatArchiveId' : ActorMethod<[], bigint>,
  '__nextChatMessageId' : ActorMethod<[], bigint>,
  '__nextChatSessionId' : ActorMethod<[], bigint>,
  '__nextChatSessionMessageId' : ActorMethod<[], bigint>,
  '__nextCommentId' : ActorMethod<[], bigint>,
  '__nextRecordingId' : ActorMethod<[], bigint>,
  '__pendingUploads' : ActorMethod<
    [[] | [bigint], [] | [bigint]],
    Array<[bigint, PendingUpload]>
  >,
  '__recordingNames' : ActorMethod<
    [[] | [bigint], [] | [bigint]],
    Array<[bigint, string]>
  >,
  '__recordings' : ActorMethod<
    [[] | [bigint], [] | [bigint]],
    Array<[bigint, Recording]>
  >,
  '__uploadChunks' : ActorMethod<
    [[] | [string], [] | [bigint]],
    Array<[string, Uint8Array | number[]]>
  >,
  '__writingStats' : ActorMethod<
    [[] | [string], [] | [bigint]],
    Array<[string, DailyWritingStat]>
  >,
  'addChatMessage' : ActorMethod<[bigint, string, string], bigint>,
  'adminGetAllIds' : ActorMethod<
    [],
    {
      'chatArchives' : Array<bigint>,
      'hourlyStatsKeys' : Array<string>,
      'chatSessionMessages' : Array<bigint>,
      'chatMessages' : Array<bigint>,
      'annotations' : Array<bigint>,
      'chapters' : Array<bigint>,
      'chatSessions' : Array<bigint>,
      'books' : Array<bigint>,
      'comments' : Array<bigint>,
      'analyses' : Array<bigint>,
      'writingStatsKeys' : Array<string>,
    }
  >,
  'adminImportAnalysis' : ActorMethod<[Analysis], undefined>,
  'adminImportAnnotation' : ActorMethod<[TextAnnotation], undefined>,
  'adminImportBook' : ActorMethod<[Book], undefined>,
  'adminImportChapter' : ActorMethod<[Chapter], undefined>,
  'adminImportChatArchive' : ActorMethod<[ChatArchive], undefined>,
  'adminImportChatMessage' : ActorMethod<[ChatMessage], undefined>,
  'adminImportChatSession' : ActorMethod<[ChatSession], undefined>,
  'adminImportChatSessionMessage' : ActorMethod<
    [ChatSessionMessage],
    undefined
  >,
  'adminImportComment' : ActorMethod<[Comment], undefined>,
  'adminImportDailyWritingStat' : ActorMethod<[DailyWritingStat], undefined>,
  'adminImportHourlyActivityStat' : ActorMethod<
    [HourlyActivityStat],
    undefined
  >,
  'adminReassignAllBooksOwner' : ActorMethod<[Principal], bigint>,
  'checkAccess' : ActorMethod<[string], boolean>,
  'clearChat' : ActorMethod<[bigint, string], boolean>,
  'createArchive' : ActorMethod<[bigint, string, string], bigint>,
  'createBook' : ActorMethod<[string, string, string], bigint>,
  'createChapter' : ActorMethod<[bigint, string], bigint>,
  'createChatSession' : ActorMethod<[bigint, string], bigint>,
  'createComment' : ActorMethod<[bigint, string, string], bigint>,
  'deleteAnalysis' : ActorMethod<[bigint], boolean>,
  'deleteArchive' : ActorMethod<[bigint], boolean>,
  'deleteBook' : ActorMethod<[bigint], boolean>,
  'deleteChapter' : ActorMethod<[bigint], boolean>,
  'deleteChatSession' : ActorMethod<[bigint], undefined>,
  'deleteComment' : ActorMethod<[bigint], boolean>,
  'deleteMessage' : ActorMethod<[bigint], boolean>,
  'deleteRecording' : ActorMethod<[bigint], boolean>,
  'exportBookSlice' : ActorMethod<[bigint], [] | [BookExport]>,
  'exportMetadata' : ActorMethod<[], ExportMetadataResponse>,
  'finishRecordingUpload' : ActorMethod<[bigint], bigint>,
  'generateInviteCode' : ActorMethod<[], string>,
  'getAnalysis' : ActorMethod<[bigint], [] | [Analysis]>,
  'getAnnotation' : ActorMethod<[bigint], [] | [TextAnnotation]>,
  'getAnnotations' : ActorMethod<[bigint], Array<TextAnnotation>>,
  'getBook' : ActorMethod<[bigint], [] | [Book]>,
  'getBookStats' : ActorMethod<
    [bigint],
    {
      'totalChars' : bigint,
      'avgWordsPerChapter' : bigint,
      'chapterCount' : bigint,
      'totalWords' : bigint,
    }
  >,
  'getChapter' : ActorMethod<[bigint], [] | [Chapter]>,
  'getChatMessages' : ActorMethod<[bigint], Array<ChatSessionMessage>>,
  'getChatSessionsByChapter' : ActorMethod<[bigint], Array<ChatSession>>,
  'getGlobalStats' : ActorMethod<[string, string], Array<DailyWritingStat>>,
  'getHourlyDistribution' : ActorMethod<[], Array<HourlyActivityStat>>,
  'getOverallStats' : ActorMethod<
    [],
    { 'totalBooks' : bigint, 'totalChapters' : bigint, 'totalWords' : bigint }
  >,
  'getRecordingAudio' : ActorMethod<[bigint], [] | [Uint8Array | number[]]>,
  'getStatsByBook' : ActorMethod<
    [bigint, string, string],
    Array<DailyWritingStat>
  >,
  'listAnalysesByBook' : ActorMethod<[bigint], Array<Analysis>>,
  'listAnalysesByChapter' : ActorMethod<[bigint], Array<Analysis>>,
  'listAnnotationsByAnalysis' : ActorMethod<[bigint], Array<TextAnnotation>>,
  'listArchivesByBook' : ActorMethod<[bigint], Array<ChatArchive>>,
  'listBooksByOwner' : ActorMethod<[], Array<Book>>,
  'listChaptersByBook' : ActorMethod<[bigint], Array<Chapter>>,
  'listCommentsByChapter' : ActorMethod<[bigint], Array<Comment>>,
  'listInviteCodes' : ActorMethod<[], Array<InviteCode>>,
  'listMessagesByBook' : ActorMethod<[bigint, string], Array<ChatMessage>>,
  'listRecordingsByChapter' : ActorMethod<
    [bigint],
    Array<
      {
        'id' : bigint,
        'voice' : string,
        'name' : [] | [string],
        'createdAt' : bigint,
      }
    >
  >,
  'recordHourlyActivity' : ActorMethod<[bigint, bigint], undefined>,
  'recordWritingActivity' : ActorMethod<
    [bigint, string, bigint, bigint, bigint],
    undefined
  >,
  'renameArchive' : ActorMethod<[bigint, string], boolean>,
  'reorderChapters' : ActorMethod<[bigint, Array<bigint>], boolean>,
  'resetMyHourlyStats' : ActorMethod<[], undefined>,
  'resetMyWritingStats' : ActorMethod<[], undefined>,
  'revokeInviteCode' : ActorMethod<[string], boolean>,
  'saveAnalysis' : ActorMethod<
    [bigint, [] | [bigint], string, string, string],
    bigint
  >,
  'saveAnnotations' : ActorMethod<
    [
      bigint,
      Array<
        {
          'alternativeProposal' : [] | [string],
          'explanation' : string,
          'color' : string,
          'text' : string,
          'proposal' : string,
        }
      >,
    ],
    Array<bigint>
  >,
  'saveRecording' : ActorMethod<
    [bigint, bigint, string, Uint8Array | number[]],
    bigint
  >,
  'sendMessage' : ActorMethod<[bigint, string, string, string, string], bigint>,
  'setAdminPrincipal' : ActorMethod<[Principal], undefined>,
  'setArchiveSummary' : ActorMethod<[bigint, string], boolean>,
  'setRecordingName' : ActorMethod<[bigint, string], boolean>,
  'startRecordingUpload' : ActorMethod<
    [bigint, bigint, string, bigint],
    bigint
  >,
  'synthesizeSpeech' : ActorMethod<
    [string, string, string],
    Uint8Array | number[]
  >,
  'ttsTransform' : ActorMethod<
    [
      {
        'context' : Uint8Array | number[],
        'response' : {
          'status' : bigint,
          'body' : Uint8Array | number[],
          'headers' : Array<{ 'value' : string, 'name' : string }>,
        },
      },
    ],
    {
      'status' : bigint,
      'body' : Uint8Array | number[],
      'headers' : Array<{ 'value' : string, 'name' : string }>,
    }
  >,
  'updateAnnotationApproved' : ActorMethod<[bigint, boolean], boolean>,
  'updateBook' : ActorMethod<[bigint, string, string, string], boolean>,
  'updateBookCharacters' : ActorMethod<[bigint, string], boolean>,
  'updateBookMetadata' : ActorMethod<
    [bigint, string, string, string, string, string],
    boolean
  >,
  'updateChapter' : ActorMethod<[bigint, string, string], boolean>,
  'updateChapterIndents' : ActorMethod<
    [bigint, bigint, bigint, bigint],
    boolean
  >,
  'uploadRecordingChunk' : ActorMethod<
    [bigint, bigint, Uint8Array | number[]],
    boolean
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
