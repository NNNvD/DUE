---
title: Moratorium on Box
topic: Reevaluating Box's famous quote
keywords:
  - george box
  - scientific modeling
  - useful models
  - limitations sections
  - abstraction
author: Noah van Dongen
coauthors: []
acknowledgments: []
status: published
initial_status: unfinished
started_at: 2025-12-29T00:00:00.000Z
proposed_at: 2025-12-29T00:00:00.000Z
deadline_at: 2026-01-28T00:00:00.000Z
published_at: '2026-02-13'
version: 0.1.0
word_range: 1000-1500
word_count: 1229
release_notes:
  - 'Auto-published at deadline (2026-02-13T13:43:26.794Z).'
permalink: /essays/published/moratorium-on-box/
---
There is a quote that many scientists are familiar with, and it has been abused for decades. In his 1976 paper \*Science and Statistics\*, George Box, a British statistician, twice writes "all models are wrong". The full quote that everybody is familiar with is "all models are wrong, but some are useful." It first appeared in the proceedings of the \*Robustness in Statistics Conference\*, held in April 1978, in Box's (1979) paper \*[Robustness in the Strategy of Scientific Model Building](https://www.sciencedirect.com/science/article/abs/pii/B9780124381506500182).\* However, almost nobody knows about this paper. Often, people reference the paper by Box and Draper (1987), \*Empirical Model-Building and Response Surfaces\*, where, in the section "The Use of Approximating Functions," the authors use a polynomial function to approximate a true response function. They write, "The fact that the polynomial is an approximation does not necessarily detract from its usefulness because all models are approximations. Essentially, all models are wrong, but some are useful."

It is this quote, "all models are wrong, but some are useful," that I see often in methodological papers or empirical papers that have a more theoretical streak of quantitative data analysis and/or formal modeling. It often appears at the end, when it is time to come clean on the faults and shortcomings of one's work, known as the "limitations section." To me, it always seems to be used as a cop out, an escape hatch for a manuscript that is speeding towards a cliff, or worse, another round of revisions.

Don't get me wrong, I enjoy Box's papers. They are insightful and eloquently written. I agree with him that our models are approximations, imperfect representations that serve a purpose. Overfitting, due to overly complex models, is a problem we should be vigilant for. It is good practice to explicate modeling assumptions and investigate the weaknesses of our models. However, I believe that Box and the people who mindlessly copy-paste his quote are actually wrong about what models are and what they are used for, in the world at large or in the particular case of statistical models.

If you agree, and I expect you do, that all models (except fashion models) are approximations--presentations of something where irrelevant details are abstracted away or smoothed out through idealizations--then you might think, now that I force you to think about it, that this quote is vacuously true: Models are wrong by their very nature. If you agree, then you should also agree that it cannot have any significance in the defense of one's modeling endeavors. Using it in one's limitation section is just bad form, and stating the obvious should not get people out of doing a better job.

However, I want to go one step further. I think there is an inherent misunderstanding of what a model is and what it is for. Let me explain this through an example. This is an aerial photo of Rotterdam, which is to be represented in some way. This is our model, the metro map of Rotterdam. Details, such as buildings and streets, are abstracted away, and locations of and distances between stations are idealized. All for the purpose of making it a useful model of Rotterdam for people who want to get around using its wonderful underground railway system. Of course, it is wrong; it does not look like Rotterdam at all, but pointing this out is missing the point and is beyond uninformative.

I think some further clarification is needed, and let me try this with the use of a metaphor. The fit of the metaphor is not great, but it is the best that I could come up with. Imagine you are disguising yourself to look like someone else. For instance, for a Halloween party or, if you are Ethan Hunt, to impersonate an arms dealer to figure out who his clients are. While you are working, this dopey friend, sitting on a chair somewhere to the side, is looking at you with a puzzled expression. After much painstaking work, you're done. You turn around and ask, "How do I look?" Your friend looks at you disappointed and reacts dejectedly, "But now you don't look like yourself anymore?" This friend is not wrong, but would you say they're right? Also, the response does not convey anything about the quality of the disguise. If disguises are "wrong" by design and models are "wrong" by definition, then it makes no sense to call them "wrong."

Talking about how, where, and to what extent models are wrong also contributes little. Details that have been removed--through abstraction or idealization--because they were considered \*irrelevant.\* So, at best, one learns something about the model in a circumspect manner. Though, only if one has some idea of the purpose of the model and \*why\* these details were considered irrelevant.

I also have a problem with the second part of the quote, "but some are useful." Models are made by people, and I am comfortable saying that this means that they are made with a purpose in mind, even model trains. Even building models for the sake of building models, as an enjoyable pastime, should be considered purposeful. Thus, I don't think I'm risking much when I assert that \*all models are useful.\* Of course, there are models that are considered useless, but that is only from the perspective of a singular goal (e.g., a certain predictive accuracy). However, I expect that it will be nigh impossible to argue that there are models that are categorically useless. For starters, you will always have the learning experience of its development. Considering the myriad reasons for modeling and the countless hours invested in their development, claiming "but some are useful" is rather insulting. In become interesting when we start to consider for what and how much a model is useful. Instead of a short paragraph around the Box quote, scientists should articulate for what or within what context the model is useful, how useful it is compared to other models or with regard to some criterion, and what can be done to improve it.

Thus, there should be a moratorium on the use of "all models are wrong, but some are useful."

I leave it as an exercise to the reader to confirm that the above applies to any model: statistical model, measurement model, predictive model, neural network, large language model, etc. (some in this list might be synonyms). Fashion models should be considered the exception.

Before I conclude, I would like to leave you with something to ponder. Even though models are wrong by design, certain types of models, when designed well, can capture something true. Our scientific theories are our current best guesses of how (part of) nature is composed and works. Aspects of such theories can be captured in models to be studied, simulate data from, and compared against observation and experimentation. If simulated data matches observation, it is not about all the ways in which the model does not match the details of the world. It is about what remains, what is doing the work, the mechanisms and principles embodied by the model, possibly representing something true of nature. This is one of my favorite models; it does not look like the solar system at all. Distances and relative sizes are wrong, and most planets are missing. However, it perfectly captures the relationships and mechanics that explain the seasons on our planet.
