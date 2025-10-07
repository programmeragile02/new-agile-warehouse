<?php

namespace App\Builder;

use App\Builder\Contracts\ActionContract;

class ActionRegistry
{
    /** @return ActionContract[] */
    public function all(): array
    {
        $list = config('builder_actions.actions', []);
        return array_values(array_map(fn ($cls) => app($cls), $list));
    }

    /** @return ActionContract[] */
    public function forEntity(string $entity): array
    {
        $entity = \Str::kebab($entity);
        return array_values(array_filter($this->all(), function (ActionContract $a) use ($entity) {
            $targets = array_map(fn ($t) => \Str::kebab($t), $a->forEntities());
            return in_array('*', $targets, true) || in_array($entity, $targets, true);
        }));
    }

    public function find(string $entity, string $key): ?ActionContract
    {
        foreach ($this->forEntity($entity) as $a) {
            if ($a->key() === $key) return $a;
        }
        return null;
    }
}
