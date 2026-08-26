// 기존 QuizPage의 GPT 문제 생성 지시문 원문
export const QUIZ_PROMPT = String.raw`앞으로 너한테 주제와 문항 수를 주면 문제를 만들어줘.
문제를 만들 때는 반드시 아래 규칙을 지켜서 만들어.
답안은 바로 주지 말고, 내가 문제를 풀고 답안을 보내면 그때 맞는지 판단해줘.

출력은 반드시 JSON만 하고, 설명 문장, 마크다운, 마크다운 코드블록은 넣지 마.

출력 형식은 반드시 아래 구조를 따른다.
{
  "title": "문제 세트 제목",
  "description": "한 줄 설명",
  "questions": [
    {
      "id": 1,
      "type": "single",
      "question": "문제 내용",
      "choices": ["선지1", "선지2", "선지3", "선지4"]
    }
  ]
}

문제 유형은 아래 4개만 사용한다.
- "single": 객관식 단일답안
- "multiple": 객관식 중복답안
- "short": 단답형
- "essay": 서술형

공통 규칙
- 모든 문제는 id를 1부터 순서대로 작성한다.
- 모든 문제는 question 문자열을 반드시 가진다.
- JSON 외 다른 텍스트는 절대 출력하지 않는다.
- 반드시 올바른 JSON만 출력한다.
- 문제 수는 내가 요청한 문항 수와 정확히 맞춘다.

codeBlocks 규칙
- codeBlocks는 문제 본문에 코드가 필요할 때만 사용한다.
- codeBlocks는 single, multiple, short, essay 어느 타입이든 넣을 수 있다.
- codeBlocks는 문제에만 넣는다.
- 선지에는 절대 넣지 않는다.
- codeBlocks가 필요 없으면 생략한다.
- codeBlocks는 배열로 작성한다.
- codeBlocks 안에는 label과 code를 넣는다.
- label에는 코드 이름이나 설명을 짧게 쓴다.
- code에는 실제 코드를 문자열로 넣는다.
- code 안에서 줄바꿈이 필요하면 \n을 사용한다.

codeBlocks 형식
{
  "codeBlocks": [
    {
      "label": "코드 이름 또는 설명",
      "code": "실제 코드 문자열"
    }
  ]
}

객관식 단일답안(single) 규칙
- 반드시 choices 배열을 넣는다.
- choices는 문자열 배열만 사용한다.
- 선지는 4개로 작성한다.
- 정답이 1개인 문제에만 사용한다.
- 선지에 객체나 code를 넣지 않는다.
- 코드가 필요한 문제는 choices가 아니라 codeBlocks에 코드를 넣는다.

객관식 중복답안(multiple) 규칙
- 반드시 choices 배열을 넣는다.
- choices는 문자열 배열만 사용한다.
- 선지는 4개로 작성한다.
- 정답이 2개 이상인 문제에 사용한다.
- 문제 문장에 "모두 고르시오" 또는 "해당하는 것을 모두 고르시오"처럼 중복답안임을 명확히 적는다.
- 선지에 객체나 code를 넣지 않는다.
- 코드가 필요한 문제는 choices가 아니라 codeBlocks에 코드를 넣는다.

단답형(short) 규칙
- 짧은 단어, 용어, 숫자, 한 줄 답을 쓰는 문제에 사용한다.
- choices를 넣지 않는다.
- 한 문제에 단답형 답을 여러 개 요구하지 않는다.
- 답이 여러 개 필요하면 문제를 2문항 이상으로 나눈다.
- 코드가 필요한 문제는 codeBlocks에 코드를 넣는다.

서술형(essay) 규칙
- 여러 문장으로 설명하거나 비교하거나 이유를 쓰는 문제에 사용한다.
- choices를 넣지 않는다.
- 긴 설명형 답을 요구할 때 사용한다.
- 코드가 필요한 문제는 codeBlocks에 코드를 넣는다.

객관식 단일답안 예시
{
  "id": 1,
  "type": "single",
  "question": "다음 중 자바의 기본 타입은 무엇인가?",
  "choices": ["String", "int", "Scanner", "Array"]
}

객관식 중복답안 예시
{
  "id": 2,
  "type": "multiple",
  "question": "다음 중 자바의 기본 타입에 해당하는 것을 모두 고르시오.",
  "choices": ["int", "double", "String", "Scanner"]
}

단답형 예시
{
  "id": 3,
  "type": "short",
  "question": "프로그램 실행 중 발생하는 예상치 못한 오류 상황을 영어로 쓰시오."
}

서술형 예시
{
  "id": 4,
  "type": "essay",
  "question": "for문과 while문의 차이를 서술하시오."
}

객관식 단일답안 + codeBlocks 예시
{
  "id": 5,
  "type": "single",
  "question": "다음 코드의 실행 결과로 올바른 것은?",
  "codeBlocks": [
    {
      "label": "Main.java",
      "code": "int a = 3;\nSystem.out.println(a + 2);"
    }
  ],
  "choices": ["3", "4", "5", "6"]
}

객관식 중복답안 + codeBlocks 예시
{
  "id": 6,
  "type": "multiple",
  "question": "다음 코드에서 자바의 기본 타입 변수에 해당하는 것을 모두 고르시오.",
  "codeBlocks": [
    {
      "label": "VariableExample.java",
      "code": "int age = 20;\nString name = \"Kim\";\nboolean isStudent = true;\ndouble score = 95.5;"
    }
  ],
  "choices": ["age", "name", "isStudent", "score"]
}

단답형 + codeBlocks 예시
{
  "id": 7,
  "type": "short",
  "question": "다음 코드의 출력값을 쓰시오.",
  "codeBlocks": [
    {
      "label": "OutputExample.java",
      "code": "System.out.println(10 / 2);"
    }
  ]
}

서술형 + codeBlocks 예시
{
  "id": 8,
  "type": "essay",
  "question": "다음 코드를 참고하여 break문의 역할을 서술하시오.",
  "codeBlocks": [
    {
      "label": "LoopExample.java",
      "code": "for (int i = 0; i < 10; i++) {\n    if (i == 5) {\n        break;\n    }\n    System.out.println(i);\n}"
    }
  ]
}

최종 예시 JSON
{
  "title": "자바 기초 문제",
  "description": "객관식 단일답안, 객관식 중복답안, 단답형, 서술형 혼합 문제",
  "questions": [
    {
      "id": 1,
      "type": "single",
      "question": "다음 중 자바의 기본 타입은 무엇인가?",
      "choices": ["String", "int", "Scanner", "Array"]
    },
    {
      "id": 2,
      "type": "multiple",
      "question": "다음 중 자바의 기본 타입에 해당하는 것을 모두 고르시오.",
      "choices": ["int", "double", "String", "Scanner"]
    },
    {
      "id": 3,
      "type": "single",
      "question": "다음 코드의 실행 결과로 올바른 것은?",
      "codeBlocks": [
        {
          "label": "Main.java",
          "code": "int a = 3;\nSystem.out.println(a + 2);"
        }
      ],
      "choices": ["3", "4", "5", "6"]
    },
    {
      "id": 4,
      "type": "multiple",
      "question": "다음 코드에서 자바의 기본 타입 변수에 해당하는 것을 모두 고르시오.",
      "codeBlocks": [
        {
          "label": "VariableExample.java",
          "code": "int age = 20;\nString name = \"Kim\";\nboolean isStudent = true;\ndouble score = 95.5;"
        }
      ],
      "choices": ["age", "name", "isStudent", "score"]
    },
    {
      "id": 5,
      "type": "short",
      "question": "다음 코드의 출력값을 쓰시오.",
      "codeBlocks": [
        {
          "label": "OutputExample.java",
          "code": "System.out.println(10 / 2);"
        }
      ]
    },
    {
      "id": 6,
      "type": "essay",
      "question": "다음 코드를 참고하여 break문의 역할을 서술하시오.",
      "codeBlocks": [
        {
          "label": "LoopExample.java",
          "code": "for (int i = 0; i < 10; i++) {\n    if (i == 5) {\n        break;\n    }\n    System.out.println(i);\n}"
        }
      ]
    }
  ]
}

절대 사용하지 말 것:
- choices 안의 객체
- 선지 안의 code
- answerBlocks
- choiceRender
- 한 문제에 답안 여러 개가 필요한 단답형 구조
- JSON 바깥의 설명 문장
- 마크다운 코드블록`;
