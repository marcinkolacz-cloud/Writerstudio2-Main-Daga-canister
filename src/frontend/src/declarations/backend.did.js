export const idlFactory = ({ IDL }) => {
  const Analysis = IDL.Record({
    'id' : IDL.Nat,
    'provider' : IDL.Text,
    'analysisType' : IDL.Text,
    'createdAt' : IDL.Int,
    'bookId' : IDL.Nat,
    'chapterId' : IDL.Opt(IDL.Nat),
    'resultContent' : IDL.Text,
  });
  const TextAnnotation = IDL.Record({
    'id' : IDL.Nat,
    'alternativeProposal' : IDL.Opt(IDL.Text),
    'explanation' : IDL.Text,
    'color' : IDL.Text,
    'text' : IDL.Text,
    'approved' : IDL.Bool,
    'analysisId' : IDL.Nat,
    'proposal' : IDL.Text,
  });
  const Book = IDL.Record({
    'id' : IDL.Nat,
    'title' : IDL.Text,
    'ownerId' : IDL.Principal,
    'authorSummary' : IDL.Text,
    'characters' : IDL.Text,
    'description' : IDL.Text,
    'updatedAt' : IDL.Int,
    'themes' : IDL.Text,
    'keyContext' : IDL.Text,
    'category' : IDL.Text,
    'ageCategory' : IDL.Text,
  });
  const Chapter = IDL.Record({
    'id' : IDL.Nat,
    'charCount' : IDL.Nat,
    'title' : IDL.Text,
    'indentFirstLine' : IDL.Nat,
    'content' : IDL.Text,
    'indentRight' : IDL.Nat,
    'wordCount' : IDL.Nat,
    'indentLeft' : IDL.Nat,
    'createdAt' : IDL.Int,
    'bookId' : IDL.Nat,
    'updatedAt' : IDL.Int,
    'sessionId' : IDL.Text,
    'orderIndex' : IDL.Nat,
  });
  const ChatArchive = IDL.Record({
    'id' : IDL.Nat,
    'title' : IDL.Text,
    'createdAt' : IDL.Int,
    'bookId' : IDL.Nat,
    'summary' : IDL.Text,
    'updatedAt' : IDL.Int,
    'sessionId' : IDL.Text,
  });
  const ChatMessage = IDL.Record({
    'id' : IDL.Nat,
    'content' : IDL.Text,
    'provider' : IDL.Text,
    'createdAt' : IDL.Int,
    'role' : IDL.Text,
    'bookId' : IDL.Nat,
    'sessionId' : IDL.Text,
  });
  const ChatSessionMessage = IDL.Record({
    'id' : IDL.Nat,
    'content' : IDL.Text,
    'createdAt' : IDL.Int,
    'role' : IDL.Text,
    'sessionId' : IDL.Nat,
  });
  const ChatSession = IDL.Record({
    'id' : IDL.Nat,
    'title' : IDL.Text,
    'createdAt' : IDL.Int,
    'chapterId' : IDL.Nat,
  });
  const Comment = IDL.Record({
    'id' : IDL.Nat,
    'content' : IDL.Text,
    'createdAt' : IDL.Int,
    'chapterId' : IDL.Nat,
    'anchorText' : IDL.Text,
  });
  const HourlyActivityStat = IDL.Record({
    'id' : IDL.Nat,
    'ownerId' : IDL.Principal,
    'wordsAdded' : IDL.Nat,
    'hour' : IDL.Nat,
  });
  const InviteCode = IDL.Record({
    'code' : IDL.Text,
    'usedAt' : IDL.Opt(IDL.Int),
    'usedBy' : IDL.Opt(IDL.Principal),
    'createdAt' : IDL.Int,
  });
  const PendingUpload = IDL.Record({
    'id' : IDL.Nat,
    'voice' : IDL.Text,
    'createdAt' : IDL.Int,
    'receivedChunks' : IDL.Nat,
    'bookId' : IDL.Nat,
    'chapterId' : IDL.Nat,
    'totalChunks' : IDL.Nat,
  });
  const Recording = IDL.Record({
    'id' : IDL.Nat,
    'voice' : IDL.Text,
    'createdAt' : IDL.Int,
    'audioData' : IDL.Vec(IDL.Nat8),
    'bookId' : IDL.Nat,
    'chapterId' : IDL.Nat,
  });
  const DailyWritingStat = IDL.Record({
    'id' : IDL.Nat,
    'activeMinutes' : IDL.Nat,
    'ownerId' : IDL.Principal,
    'wordsAdded' : IDL.Nat,
    'date' : IDL.Text,
    'bookId' : IDL.Nat,
    'netWords' : IDL.Int,
    'sessionCount' : IDL.Nat,
    'wordsRemoved' : IDL.Nat,
  });
  const BookExport = IDL.Record({
    'chatArchives' : IDL.Vec(ChatArchive),
    'chatSessionMessages' : IDL.Vec(ChatSessionMessage),
    'book' : Book,
    'chatMessages' : IDL.Vec(ChatMessage),
    'annotations' : IDL.Vec(TextAnnotation),
    'chapters' : IDL.Vec(Chapter),
    'chatSessions' : IDL.Vec(ChatSession),
    'comments' : IDL.Vec(Comment),
    'analyses' : IDL.Vec(Analysis),
  });
  const ExportMetadataResponse = IDL.Record({
    'owner' : IDL.Principal,
    'bookCount' : IDL.Nat,
    'exportedAt' : IDL.Int,
  });
  return IDL.Service({
    '__adminPrincipal' : IDL.Func([], [IDL.Opt(IDL.Principal)], ['query']),
    '__analyses' : IDL.Func(
        [IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Nat, Analysis))],
        ['query'],
      ),
    '__annotations' : IDL.Func(
        [IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Nat, TextAnnotation))],
        ['query'],
      ),
    '__books' : IDL.Func(
        [IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Nat, Book))],
        ['query'],
      ),
    '__chapters' : IDL.Func(
        [IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Nat, Chapter))],
        ['query'],
      ),
    '__chatArchives' : IDL.Func(
        [IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Nat, ChatArchive))],
        ['query'],
      ),
    '__chatMessages' : IDL.Func(
        [IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Nat, ChatMessage))],
        ['query'],
      ),
    '__chatSessionMessages' : IDL.Func(
        [IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Nat, ChatSessionMessage))],
        ['query'],
      ),
    '__chatSessions' : IDL.Func(
        [IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Nat, ChatSession))],
        ['query'],
      ),
    '__comments' : IDL.Func(
        [IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Nat, Comment))],
        ['query'],
      ),
    '__hourlyStats' : IDL.Func(
        [IDL.Opt(IDL.Text), IDL.Opt(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Text, HourlyActivityStat))],
        ['query'],
      ),
    '__inviteCodes' : IDL.Func(
        [IDL.Opt(IDL.Text), IDL.Opt(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Text, InviteCode))],
        ['query'],
      ),
    '__nextAnalysisId' : IDL.Func([], [IDL.Nat], ['query']),
    '__nextAnnotationId' : IDL.Func([], [IDL.Nat], ['query']),
    '__nextBookId' : IDL.Func([], [IDL.Nat], ['query']),
    '__nextChapterId' : IDL.Func([], [IDL.Nat], ['query']),
    '__nextChatArchiveId' : IDL.Func([], [IDL.Nat], ['query']),
    '__nextChatMessageId' : IDL.Func([], [IDL.Nat], ['query']),
    '__nextChatSessionId' : IDL.Func([], [IDL.Nat], ['query']),
    '__nextChatSessionMessageId' : IDL.Func([], [IDL.Nat], ['query']),
    '__nextCommentId' : IDL.Func([], [IDL.Nat], ['query']),
    '__nextRecordingId' : IDL.Func([], [IDL.Nat], ['query']),
    '__pendingUploads' : IDL.Func(
        [IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Nat, PendingUpload))],
        ['query'],
      ),
    '__recordingNames' : IDL.Func(
        [IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Nat, IDL.Text))],
        ['query'],
      ),
    '__recordings' : IDL.Func(
        [IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Nat, Recording))],
        ['query'],
      ),
    '__uploadChunks' : IDL.Func(
        [IDL.Opt(IDL.Text), IDL.Opt(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Vec(IDL.Nat8)))],
        ['query'],
      ),
    '__writingStats' : IDL.Func(
        [IDL.Opt(IDL.Text), IDL.Opt(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Text, DailyWritingStat))],
        ['query'],
      ),
    'addChatMessage' : IDL.Func([IDL.Nat, IDL.Text, IDL.Text], [IDL.Nat], []),
    'adminGetAllIds' : IDL.Func(
        [],
        [
          IDL.Record({
            'chatArchives' : IDL.Vec(IDL.Nat),
            'hourlyStatsKeys' : IDL.Vec(IDL.Text),
            'chatSessionMessages' : IDL.Vec(IDL.Nat),
            'chatMessages' : IDL.Vec(IDL.Nat),
            'annotations' : IDL.Vec(IDL.Nat),
            'chapters' : IDL.Vec(IDL.Nat),
            'chatSessions' : IDL.Vec(IDL.Nat),
            'books' : IDL.Vec(IDL.Nat),
            'comments' : IDL.Vec(IDL.Nat),
            'analyses' : IDL.Vec(IDL.Nat),
            'writingStatsKeys' : IDL.Vec(IDL.Text),
          }),
        ],
        ['query'],
      ),
    'adminImportAnalysis' : IDL.Func([Analysis], [], []),
    'adminImportAnnotation' : IDL.Func([TextAnnotation], [], []),
    'adminImportBook' : IDL.Func([Book], [], []),
    'adminImportChapter' : IDL.Func([Chapter], [], []),
    'adminImportChatArchive' : IDL.Func([ChatArchive], [], []),
    'adminImportChatMessage' : IDL.Func([ChatMessage], [], []),
    'adminImportChatSession' : IDL.Func([ChatSession], [], []),
    'adminImportChatSessionMessage' : IDL.Func([ChatSessionMessage], [], []),
    'adminImportComment' : IDL.Func([Comment], [], []),
    'adminImportDailyWritingStat' : IDL.Func([DailyWritingStat], [], []),
    'adminImportHourlyActivityStat' : IDL.Func([HourlyActivityStat], [], []),
    'adminReassignAllBooksOwner' : IDL.Func([IDL.Principal], [IDL.Nat], []),
    'checkAccess' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'clearChat' : IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
    'createArchive' : IDL.Func([IDL.Nat, IDL.Text, IDL.Text], [IDL.Nat], []),
    'createBook' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
    'createChapter' : IDL.Func([IDL.Nat, IDL.Text], [IDL.Nat], []),
    'createChatSession' : IDL.Func([IDL.Nat, IDL.Text], [IDL.Nat], []),
    'createComment' : IDL.Func([IDL.Nat, IDL.Text, IDL.Text], [IDL.Nat], []),
    'deleteAnalysis' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'deleteArchive' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'deleteBook' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'deleteChapter' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'deleteChatSession' : IDL.Func([IDL.Nat], [], []),
    'deleteComment' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'deleteMessage' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'deleteRecording' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'exportBookSlice' : IDL.Func([IDL.Nat], [IDL.Opt(BookExport)], ['query']),
    'exportMetadata' : IDL.Func([], [ExportMetadataResponse], ['query']),
    'finishRecordingUpload' : IDL.Func([IDL.Nat], [IDL.Nat], []),
    'generateInviteCode' : IDL.Func([], [IDL.Text], []),
    'getAnalysis' : IDL.Func([IDL.Nat], [IDL.Opt(Analysis)], []),
    'getAnnotation' : IDL.Func([IDL.Nat], [IDL.Opt(TextAnnotation)], []),
    'getAnnotations' : IDL.Func([IDL.Nat], [IDL.Vec(TextAnnotation)], []),
    'getBook' : IDL.Func([IDL.Nat], [IDL.Opt(Book)], []),
    'getBookStats' : IDL.Func(
        [IDL.Nat],
        [
          IDL.Record({
            'totalChars' : IDL.Nat,
            'avgWordsPerChapter' : IDL.Nat,
            'chapterCount' : IDL.Nat,
            'totalWords' : IDL.Nat,
          }),
        ],
        [],
      ),
    'getChapter' : IDL.Func([IDL.Nat], [IDL.Opt(Chapter)], []),
    'getChatMessages' : IDL.Func([IDL.Nat], [IDL.Vec(ChatSessionMessage)], []),
    'getChatSessionsByChapter' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(ChatSession)],
        [],
      ),
    'getGlobalStats' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Vec(DailyWritingStat)],
        [],
      ),
    'getHourlyDistribution' : IDL.Func([], [IDL.Vec(HourlyActivityStat)], []),
    'getOverallStats' : IDL.Func(
        [],
        [
          IDL.Record({
            'totalBooks' : IDL.Nat,
            'totalChapters' : IDL.Nat,
            'totalWords' : IDL.Nat,
          }),
        ],
        [],
      ),
    'getRecordingAudio' : IDL.Func([IDL.Nat], [IDL.Opt(IDL.Vec(IDL.Nat8))], []),
    'getStatsByBook' : IDL.Func(
        [IDL.Nat, IDL.Text, IDL.Text],
        [IDL.Vec(DailyWritingStat)],
        [],
      ),
    'listAnalysesByBook' : IDL.Func([IDL.Nat], [IDL.Vec(Analysis)], []),
    'listAnalysesByChapter' : IDL.Func([IDL.Nat], [IDL.Vec(Analysis)], []),
    'listAnnotationsByAnalysis' : IDL.Func(
        [IDL.Nat],
        [IDL.Vec(TextAnnotation)],
        [],
      ),
    'listArchivesByBook' : IDL.Func([IDL.Nat], [IDL.Vec(ChatArchive)], []),
    'listBooksByOwner' : IDL.Func([], [IDL.Vec(Book)], []),
    'listChaptersByBook' : IDL.Func([IDL.Nat], [IDL.Vec(Chapter)], []),
    'listCommentsByChapter' : IDL.Func([IDL.Nat], [IDL.Vec(Comment)], []),
    'listInviteCodes' : IDL.Func([], [IDL.Vec(InviteCode)], []),
    'listMessagesByBook' : IDL.Func(
        [IDL.Nat, IDL.Text],
        [IDL.Vec(ChatMessage)],
        [],
      ),
    'listRecordingsByChapter' : IDL.Func(
        [IDL.Nat],
        [
          IDL.Vec(
            IDL.Record({
              'id' : IDL.Nat,
              'voice' : IDL.Text,
              'name' : IDL.Opt(IDL.Text),
              'createdAt' : IDL.Int,
            })
          ),
        ],
        [],
      ),
    'recordHourlyActivity' : IDL.Func([IDL.Nat, IDL.Nat], [], []),
    'recordWritingActivity' : IDL.Func(
        [IDL.Nat, IDL.Text, IDL.Nat, IDL.Nat, IDL.Nat],
        [],
        [],
      ),
    'renameArchive' : IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
    'reorderChapters' : IDL.Func([IDL.Nat, IDL.Vec(IDL.Nat)], [IDL.Bool], []),
    'resetMyHourlyStats' : IDL.Func([], [], []),
    'resetMyWritingStats' : IDL.Func([], [], []),
    'revokeInviteCode' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'saveAnalysis' : IDL.Func(
        [IDL.Nat, IDL.Opt(IDL.Nat), IDL.Text, IDL.Text, IDL.Text],
        [IDL.Nat],
        [],
      ),
    'saveAnnotations' : IDL.Func(
        [
          IDL.Nat,
          IDL.Vec(
            IDL.Record({
              'alternativeProposal' : IDL.Opt(IDL.Text),
              'explanation' : IDL.Text,
              'color' : IDL.Text,
              'text' : IDL.Text,
              'proposal' : IDL.Text,
            })
          ),
        ],
        [IDL.Vec(IDL.Nat)],
        [],
      ),
    'saveRecording' : IDL.Func(
        [IDL.Nat, IDL.Nat, IDL.Text, IDL.Vec(IDL.Nat8)],
        [IDL.Nat],
        [],
      ),
    'sendMessage' : IDL.Func(
        [IDL.Nat, IDL.Text, IDL.Text, IDL.Text, IDL.Text],
        [IDL.Nat],
        [],
      ),
    'setAdminPrincipal' : IDL.Func([IDL.Principal], [], []),
    'setArchiveSummary' : IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
    'setRecordingName' : IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
    'startRecordingUpload' : IDL.Func(
        [IDL.Nat, IDL.Nat, IDL.Text, IDL.Nat],
        [IDL.Nat],
        [],
      ),
    'synthesizeSpeech' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [IDL.Vec(IDL.Nat8)],
        [],
      ),
    'ttsTransform' : IDL.Func(
        [
          IDL.Record({
            'context' : IDL.Vec(IDL.Nat8),
            'response' : IDL.Record({
              'status' : IDL.Nat,
              'body' : IDL.Vec(IDL.Nat8),
              'headers' : IDL.Vec(
                IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text })
              ),
            }),
          }),
        ],
        [
          IDL.Record({
            'status' : IDL.Nat,
            'body' : IDL.Vec(IDL.Nat8),
            'headers' : IDL.Vec(
              IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text })
            ),
          }),
        ],
        ['query'],
      ),
    'updateAnnotationApproved' : IDL.Func([IDL.Nat, IDL.Bool], [IDL.Bool], []),
    'updateBook' : IDL.Func(
        [IDL.Nat, IDL.Text, IDL.Text, IDL.Text],
        [IDL.Bool],
        [],
      ),
    'updateBookCharacters' : IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
    'updateBookMetadata' : IDL.Func(
        [IDL.Nat, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text],
        [IDL.Bool],
        [],
      ),
    'updateChapter' : IDL.Func([IDL.Nat, IDL.Text, IDL.Text], [IDL.Bool], []),
    'updateChapterIndents' : IDL.Func(
        [IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat],
        [IDL.Bool],
        [],
      ),
    'uploadRecordingChunk' : IDL.Func(
        [IDL.Nat, IDL.Nat, IDL.Vec(IDL.Nat8)],
        [IDL.Bool],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
